"use client";

import React, { useState } from "react";
import { supabase } from "../config/supabase";

interface AuthProps {
  onAuth?: () => void;
}

export default function Auth({ onAuth }: AuthProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setMessage("Signed in successfully!");
      if (onAuth) onAuth();
    } catch (error: any) {
      setError(error.message || "An error occurred during sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      setMessage("Check your email for the confirmation link!");
    } catch (error: any) {
      setError(error.message || "An error occurred during sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <h2 className="auth-title">
        {isSignUp ? "Create a Character Account" : "Login to Your Adventure"}
      </h2>

      {error && <div className="auth-error-message">{error}</div>}

      {message && <div className="auth-success-message">{message}</div>}

      <form onSubmit={isSignUp ? handleSignUp : handleSignIn}>
        <div className="auth-input-group">
          <label htmlFor="email" className="auth-label">
            Adventurer's Email
          </label>
          <div className="auth-input-wrapper">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-input"
              placeholder="Enter your email"
            />
            <span className="auth-input-icon">✉️</span>
          </div>
        </div>

        <div className="auth-input-group">
          <label htmlFor="password" className="auth-label">
            Secret Password
          </label>
          <div className="auth-input-wrapper">
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-input"
              minLength={6}
              placeholder="Enter your password"
            />
            <span className="auth-input-icon">🔒</span>
          </div>
        </div>

        <div className="auth-button-container">
          <button
            type="submit"
            className="auth-submit-button"
            disabled={loading}
          >
            {loading
              ? "Casting Spell..."
              : isSignUp
              ? "Begin Your Quest"
              : "Enter the Realm"}
          </button>
        </div>
      </form>

      <div className="auth-toggle">
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="auth-toggle-button"
        >
          {isSignUp
            ? "Already an adventurer? Sign in"
            : "New adventurer? Create an account"}
        </button>
      </div>
    </div>
  );
}
