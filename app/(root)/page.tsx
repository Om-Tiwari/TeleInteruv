'use client';

import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import JobDescriptionSelector from "@/components/JobDescriptionSelector";

interface JDData {
    jobTitle: string;
    id: string;
    json: JSON;
}


const handleJDSelect = async (jd: JDData) => {
    // Optionally: show loading UI (use a state variable if needed)
    try {
        // Store JD JSON in localStorage (non-blocking)
        console.log(jd.json)

    } catch (err) {
        // Handle error (show error UI or toast)
        console.error('Error processing selection:', err);
    }
};


const Page = () => {

    return (
        <main className="flex flex-col items-center px-4 py-8">
            {/* Hero Section */}
            <section className="w-full max-w-4xl flex flex-col-reverse md:flex-row items-center gap-8 bg-card rounded-xl shadow-lg p-8 mb-12">
                <div className="flex-1 flex flex-col gap-6">
                    <h1 className="text-3xl md:text-4xl font-bold">
                        Get Interview-Ready with <span className="text-primary">AI-Powered Practice</span>
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Practice real interview questions, get instant feedback, and boost your confidence.
                    </p>
                </div>
            </section>

            {/* Features Section */}
            <section className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="feature-card">
                    <h3 className="font-semibold text-lg mb-2">Real Questions</h3>
                    <p>Practice with questions from top companies and roles.</p>
                </div>
                <div className="feature-card">
                    <h3 className="font-semibold text-lg mb-2">AI Feedback</h3>
                    <p>Get instant, actionable feedback on your answers.</p>
                </div>
                <div className="feature-card">
                    <h3 className="font-semibold text-lg mb-2">Track Progress</h3>
                    <p>Monitor your improvement and revisit past interviews.</p>
                </div>
            </section>

            <section className="w-full max-w-4xl mb-12">
                <h2 className="text-2xl font-semibold mb-4">Select a Job Description to Start</h2>
                <JobDescriptionSelector onSelect={handleJDSelect} />
            </section>

        </main>
    );
};

export default Page;