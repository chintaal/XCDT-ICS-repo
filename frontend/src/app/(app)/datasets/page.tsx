"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FileWarning } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty";
import { apiEndpoints } from "@/lib/api/endpoints";
import { DatasetCard } from "@/components/datasets/dataset-card";

export default function DatasetsPage() {
  const datasetsQ = useQuery({
    queryKey: ["datasets"],
    queryFn: () => apiEndpoints.datasets.list(),
  });

  return (
    <div className="flex flex-col gap-6 pb-10">
      <PageHeader
        eyebrow="Models & assets"
        title="Datasets"
        description="Each dataset has its own self-supervised encoder checkpoint and replay CSV. Start an inference run from any dataset whose assets are available."
      />

      <div className="px-6">
        {datasetsQ.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[260px]" />
            ))}
          </div>
        ) : datasetsQ.isError || !datasetsQ.data ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={<FileWarning />}
                title="Could not load datasets"
                description="Verify the API server is running."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {datasetsQ.data.map((d, idx) => (
              <motion.div
                key={d.key}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
              >
                <DatasetCard dataset={d} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
