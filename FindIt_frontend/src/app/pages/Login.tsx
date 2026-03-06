import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { MapPin, Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function Login() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
};