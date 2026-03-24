import "dotenv/config";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const KEEP_DATA = process.env.KEEP_DATA === "1";
const SKIP_IMAGES = process.env.SKIP_IMAGES === "1";
const EXPECT_SPACES = process.env.EXPECT_SPACES === "1";
const HEALTH_TIMEOUT_MS = Number(process.env.HEALTH_TIMEOUT_MS || 30000);
const EMAIL_DOMAIN = process.env.EMAIL_DOMAIN || "mail.utoronto.ca";
const DO_SPACES_ENDPOINT = process.env.DO_SPACES_ENDPOINT || "";
const DO_SPACES_BUCKET = process.env.DO_SPACES_BUCKET || "";
const DO_SPACES_CDN_ENDPOINT = process.env.DO_SPACES_CDN_ENDPOINT || "";

const tinyPngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z7f8AAAAASUVORK5CYII=";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildUrl(path, query = {}) {
  const url = new URL(path, BASE_URL);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function normalizeHost(value) {
  return value.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

function getExpectedSpacesHosts() {
  const hosts = new Set();

  if (DO_SPACES_CDN_ENDPOINT) {
    hosts.add(normalizeHost(DO_SPACES_CDN_ENDPOINT));
  }

  if (DO_SPACES_BUCKET && DO_SPACES_ENDPOINT) {
    hosts.add(`${DO_SPACES_BUCKET}.${normalizeHost(DO_SPACES_ENDPOINT)}`);
  }

  return hosts;
}

async function requestJson(name, { method = "GET", path, token, query, body, formData }) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body ? JSON.stringify(body) : formData,
  });

  const text = await response.text();
  let parsed = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  const statusLine = `[${response.status}] ${method} ${path}`;
  if (!response.ok) {
    const detail = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
    throw new Error(`${name} failed ${statusLine}: ${detail}`);
  }

  console.log(`${statusLine} OK`);
  return parsed;
}

async function safeRequest(name, options) {
  try {
    await requestJson(name, options);
  } catch (error) {
    console.error(`Cleanup warning: ${error.message}`);
  }
}

async function waitForHealth() {
  const startedAt = Date.now();

  while (Date.now() - startedAt < HEALTH_TIMEOUT_MS) {
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      if (response.ok) {
        const payload = await response.json();
        console.log(`Health check passed: ${payload.status}`);
        return;
      }
    } catch {
      // Retry until timeout.
    }

    await sleep(1000);
  }

  throw new Error(`Backend did not become healthy within ${HEALTH_TIMEOUT_MS}ms at ${BASE_URL}`);
}

async function verifyPublicImageUrl(name, publicUrl) {
  const response = await fetch(publicUrl, { method: "GET" });
  if (!response.ok) {
    throw new Error(`${name} publicUrl is not reachable: ${publicUrl} returned ${response.status}`);
  }

  console.log(`Verified public image URL: ${publicUrl}`);
}

async function assertImageUploadMode(name, publicUrl) {
  const appOrigin = new URL(BASE_URL).origin;
  const uploadedUrl = new URL(publicUrl);

  if (EXPECT_SPACES) {
    const expectedHosts = getExpectedSpacesHosts();
    if (expectedHosts.size === 0) {
      throw new Error(
        "EXPECT_SPACES=1 requires DO_SPACES_BUCKET plus DO_SPACES_ENDPOINT or DO_SPACES_CDN_ENDPOINT in backend/.env"
      );
    }

    if (publicUrl.startsWith(`${appOrigin}/uploads/`)) {
      throw new Error(`${name} still uses local /uploads URL instead of Spaces: ${publicUrl}`);
    }

    if (!expectedHosts.has(uploadedUrl.host)) {
      throw new Error(
        `${name} publicUrl host ${uploadedUrl.host} does not match expected Spaces hosts: ${Array.from(expectedHosts).join(", ")}`
      );
    }
  }

  await verifyPublicImageUrl(name, publicUrl);
}

function makeImageFormData(filename) {
  const formData = new FormData();
  const imageBuffer = Buffer.from(tinyPngBase64, "base64");
  const imageBlob = new Blob([imageBuffer], { type: "image/png" });
  formData.append("images", imageBlob, filename);
  return formData;
}

async function main() {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const owner = {
    uoftEmail: `owner.${suffix}@${EMAIL_DOMAIN}`,
    password: "OwnerPass123!",
    displayName: `Smoke Owner ${suffix}`,
  };
  const finder = {
    uoftEmail: `finder.${suffix}@${EMAIL_DOMAIN}`,
    password: "FinderPass123!",
    displayName: `Smoke Finder ${suffix}`,
  };

  const state = {
    ownerToken: null,
    finderToken: null,
    ownerUserId: null,
    finderUserId: null,
    reportId: null,
    sightingId: null,
    reportImageId: null,
    sightingImageId: null,
    reportImageUrl: null,
    sightingImageUrl: null,
  };

  console.log(`Running smoke test against ${BASE_URL}`);
  console.log(
    `KEEP_DATA=${KEEP_DATA ? "1" : "0"} SKIP_IMAGES=${SKIP_IMAGES ? "1" : "0"} EXPECT_SPACES=${EXPECT_SPACES ? "1" : "0"}`
  );

  await waitForHealth();

  try {
    const ownerRegister = await requestJson("register owner", {
      method: "POST",
      path: "/api/auth/register",
      body: owner,
    });
    state.ownerToken = ownerRegister.data.token;
    state.ownerUserId = ownerRegister.data.user.id;

    const finderRegister = await requestJson("register finder", {
      method: "POST",
      path: "/api/auth/register",
      body: finder,
    });
    state.finderToken = finderRegister.data.token;
    state.finderUserId = finderRegister.data.user.id;

    await requestJson("owner profile", {
      method: "GET",
      path: "/api/auth/profile",
      token: state.ownerToken,
    });

    const reportCreate = await requestJson("create report", {
      method: "POST",
      path: "/api/reports",
      token: state.ownerToken,
      body: {
        itemName: "Smoke Test Wallet",
        description: "Temporary report created by the smoke test.",
        lostTime: new Date().toISOString(),
        lostLocationText: "Bahen Centre",
        latitude: 43.6596,
        longitude: -79.3977,
        radiusMeters: 100,
      },
    });
    state.reportId = reportCreate.data.id;

    await requestJson("list reports", {
      method: "GET",
      path: "/api/reports",
      token: state.ownerToken,
      query: {
        search: "Wallet",
        page: 1,
        limit: 10,
      },
    });

    await requestJson("map reports", {
      method: "GET",
      path: "/api/reports/map",
    });

    await requestJson("my reports", {
      method: "GET",
      path: "/api/reports/mine",
      token: state.ownerToken,
    });

    await requestJson("get report by id", {
      method: "GET",
      path: `/api/reports/${state.reportId}`,
      token: state.ownerToken,
    });

    if (!SKIP_IMAGES) {
      const reportImageUpload = await requestJson("upload report image", {
        method: "POST",
        path: `/api/reports/${state.reportId}/images`,
        token: state.ownerToken,
        formData: makeImageFormData("report-smoke.png"),
      });
      state.reportImageId = reportImageUpload.data[0]?.id || null;
      state.reportImageUrl = reportImageUpload.data[0]?.publicUrl || null;

      if (state.reportImageUrl) {
        await assertImageUploadMode("report image", state.reportImageUrl);
      }
    }

    await requestJson("list sightings", {
      method: "GET",
      path: `/api/reports/${state.reportId}/sightings`,
    });

    const sightingCreate = await requestJson("create sighting", {
      method: "POST",
      path: `/api/reports/${state.reportId}/sightings`,
      token: state.finderToken,
      body: {
        note: "Temporary sighting created by the smoke test.",
      },
    });
    state.sightingId = sightingCreate.data.id;

    if (!SKIP_IMAGES) {
      const sightingImageUpload = await requestJson("upload sighting image", {
        method: "POST",
        path: `/api/sightings/${state.sightingId}/images`,
        token: state.finderToken,
        formData: makeImageFormData("sighting-smoke.png"),
      });
      state.sightingImageId = sightingImageUpload.data[0]?.id || null;
      state.sightingImageUrl = sightingImageUpload.data[0]?.publicUrl || null;

      if (state.sightingImageUrl) {
        await assertImageUploadMode("sighting image", state.sightingImageUrl);
      }
    }

    await requestJson("send owner message", {
      method: "POST",
      path: `/api/reports/${state.reportId}/messages`,
      token: state.ownerToken,
      body: {
        receiverId: state.finderUserId,
        messageText: "Smoke test owner message.",
      },
    });

    await requestJson("send finder message", {
      method: "POST",
      path: `/api/reports/${state.reportId}/messages`,
      token: state.finderToken,
      body: {
        receiverId: state.ownerUserId,
        messageText: "Smoke test finder reply.",
      },
    });

    await requestJson("list report messages", {
      method: "GET",
      path: `/api/reports/${state.reportId}/messages`,
      token: state.ownerToken,
    });

    await requestJson("owner conversations", {
      method: "GET",
      path: "/api/messages/conversations",
      token: state.ownerToken,
    });

    await requestJson("mark report found", {
      method: "PUT",
      path: `/api/reports/${state.reportId}`,
      token: state.ownerToken,
      body: {
        status: "found",
      },
    });

    console.log("Smoke test completed successfully.");
    console.log(
      JSON.stringify(
        {
          reportId: state.reportId,
          sightingId: state.sightingId,
          reportImageId: state.reportImageId,
          sightingImageId: state.sightingImageId,
          reportImageUrl: state.reportImageUrl,
          sightingImageUrl: state.sightingImageUrl,
          keptData: KEEP_DATA,
          expectedSpaces: EXPECT_SPACES,
        },
        null,
        2
      )
    );
  } finally {
    if (KEEP_DATA) {
      console.log("Skipping cleanup because KEEP_DATA=1.");
      return;
    }

    if (state.sightingImageId) {
      await safeRequest("delete sighting image", {
        method: "DELETE",
        path: `/api/images/sighting/${state.sightingImageId}`,
        token: state.finderToken,
      });
    }

    if (state.reportImageId) {
      await safeRequest("delete report image", {
        method: "DELETE",
        path: `/api/images/report/${state.reportImageId}`,
        token: state.ownerToken,
      });
    }

    if (state.sightingId) {
      await safeRequest("delete sighting", {
        method: "DELETE",
        path: `/api/sightings/${state.sightingId}`,
        token: state.finderToken,
      });
    }

    if (state.reportId) {
      await safeRequest("delete report", {
        method: "DELETE",
        path: `/api/reports/${state.reportId}`,
        token: state.ownerToken,
      });
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
