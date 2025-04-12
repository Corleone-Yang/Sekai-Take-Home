"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Auth from "../../components/Auth";
import { supabase } from "../../config/supabase";
import "./page.less";

export default function Login() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          // User is already logged in, redirect to adventure page
          router.push("/");
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [router]);

  const handleAuth = () => {
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <video autoPlay loop muted className="video-background">
        <source src="/images/anime/Login.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="content-card">
        <h1 className="page-title">D&D-Style Interactive Adventure</h1>
        <p className="page-description">
          Embark on an AI-powered text adventure where your choices matter.
        </p>

        <div className="space-y-6">
          <div className="how-to-play">
            <h2 className="how-to-play-title">How to Play</h2>
            <ol className="how-to-play-list">
              <li>Create a character with unique abilities</li>
              <li>The AI describes the scene or situation</li>
              <li>You decide what your character does or says</li>
              <li>
                The AI determines the outcome based on your abilities and
                choices
              </li>
              <li>The AI describes the results and how the world reacts</li>
              <li>The story progresses based on these interactions</li>
            </ol>
          </div>

          <div className="auth-container">
            <Auth onAuth={handleAuth} />
          </div>
        </div>
      </div>
    </div>
  );
}
