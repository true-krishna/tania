"use client";

import { Card } from "@/components/Card";
import { IndividualCharts } from "./IndividualCharts";
import { IndividualLeavesCard, IndividualSummaryCards } from "./IndividualSummaryCards";
import { BacklogTable } from "./BacklogTable";
import type { TalentWorkloadFixture } from "./types";

export function TalentWorkloadDetail({ fixture }: { fixture: TalentWorkloadFixture }) {
  if (!fixture.summary) return null;

  return (
    <div className="flex flex-col gap-4">
      <IndividualSummaryCards summary={fixture.summary} />
      {fixture.assignedProjects ? (
        <Card className="flex flex-col gap-4">
          <div>
            <h2 className="tp-h3">Assignments</h2>
            <p className="tp-label mt-1">Penempatan project talent pada periode terpilih.</p>
          </div>
          <div className="table-panel">
            <div className="table-scroll">
              <table className="w-full min-w-[720px]">
                <caption className="sr-only">Tabel assignment project talent</caption>
                <thead>
                  <tr>
                    <th className="text-left" scope="col">
                      Project
                    </th>
                    <th className="text-left" scope="col">
                      Tribe
                    </th>
                    <th className="text-left" scope="col">
                      Product
                    </th>
                    <th className="text-left" scope="col">
                      Squad
                    </th>
                    <th className="text-right" scope="col">
                      Availability
                    </th>
                    <th className="text-right" scope="col">
                      Time Spent
                    </th>
                    <th className="text-left" scope="col">
                      Keterangan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fixture.assignedProjects.map((row) => (
                    <tr key={`${row.projectKey}-${row.squad}`}>
                      <td className="font-medium text-tp-text">{row.projectKey}</td>
                      <td>{row.tribe}</td>
                      <td>{row.product}</td>
                      <td>{row.squad}</td>
                      <td className="text-right">{row.availability}%</td>
                      <td className="text-right">{row.timespent} jam</td>
                      <td className="max-w-[320px]">{row.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      ) : null}
      {fixture.summary.leaves && fixture.summary.leaves.leavesList.length > 0 ? (
        <Card className="flex flex-col gap-3">
          <h2 className="tp-h3">Cuti & ketidakhadiran</h2>
          <IndividualLeavesCard leaves={fixture.summary.leaves} />
        </Card>
      ) : null}
      {fixture.statusBacklog && fixture.timespentPerProject && fixture.trendBacklog ? (
        <IndividualCharts
          statusBacklog={fixture.statusBacklog}
          timespentPerProject={fixture.timespentPerProject}
          trendBacklog={fixture.trendBacklog}
        />
      ) : null}
      {fixture.backlog && fixture.backlogNormalized ? (
        <BacklogTable backlog={fixture.backlog} backlogNormalized={fixture.backlogNormalized} />
      ) : null}
    </div>
  );
}
