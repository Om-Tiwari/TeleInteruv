'use client';

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "@/components/ui/alert-triangle";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface JDData {
  jobTitle: string;
  id: string;
  json: JSON;
}

interface JobDescriptionSelectorProps {
  onSelect: (jd: JDData) => void;
}

const JobDescriptionSelector: React.FC<JobDescriptionSelectorProps> = ({ onSelect }) => {
  const [jds, setJds] = useState<JDData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);

  useEffect(() => {
    fetchJDs();
    // eslint-disable-next-line
  }, []);

  const fetchJDs = async () => {
    try {
      setIsLoading(true);
      setLoadingStatus('Fetching job descriptions...');
      setLoadingProgress(10);
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(
        `${API_URL}/api/jds`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch JDs: ${response.status} ${errorText || response.statusText}`);
      }

      setLoadingProgress(50);
      const data = await response.json();
      setLoadingProgress(100);
      setJds(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Request timed out. Please check your connection and try again.');
      } else {
        setError('Could not load job descriptions. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setLoadingStatus(null);
      setLoadingProgress(0);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Progress value={loadingProgress} className="mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="min-h-[100px]">
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
        {loadingStatus && <div className="text-muted-foreground text-center">{loadingStatus}</div>}
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="mb-4">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button variant="outline" size="sm" onClick={fetchJDs} className="mt-2">Try Again</Button>
      </Alert>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {jds.map((jd) => (
        <Card
          key={jd.id}
          className="hover:shadow-lg transition cursor-pointer bg-card border-primary border-2"
          onClick={() => onSelect(jd)}
        >
          <CardHeader>
            <CardTitle>{jd.jobTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-2">Seniority: {jd.json.experienceLevel}</p>
            <Button variant="outline" size="sm" className="w-full mt-2">Select</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default JobDescriptionSelector;