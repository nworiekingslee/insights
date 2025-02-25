import { useEffect, useState } from "react";
import useSWR from "swr";
import { getCommitsLast30Days } from "lib/utils/get-recent-commits";
import { useRouter } from "next/router";
import getFilterQuery from "lib/utils/get-filter-query";

interface PaginatedTopicCommitResponse {
  readonly data: DbRepoCommit[];
  readonly meta: Meta;
}
const useTopicContributorCommits = (contributor: string, topic: string, repoIds: number[] = []) => {
  const lineChart = {
    xAxis: {
      type: "category",
      boundaryGap: false,
      axisLabel: false
    },
    yAxis: {
      type: "value",
      splitNumber: 1,
      axisLabel: false,
      splitLine: {
        lineStyle: {
          type: "dashed"
        }
      }
    },
    grid: {
      height: 100,
      top: 0,
      bottom: 0,
      right: 0,
      left: 0
    },
    series: [
      {
        type: "line",
        smooth: true,
        showSymbol: false,
        lineStyle: {
          color: "#ff9800"
        },
        areaStyle: {
          color: "#FFB74D",
          opacity: 0.6
        }
      }
    ]
  };

  const [chart, setChart] = useState(lineChart);
  const router = useRouter();
  const baseEndpoint = `${topic}/${contributor}/commits`;
  const { selectedFilter } = router.query;
  const filterQuery = getFilterQuery(selectedFilter);
  const reposQuery = repoIds.length > 0 ? `repoIds=${repoIds.join(",")}`: "";
  const endpointString = `${baseEndpoint}?${filterQuery.replace("&", "")}${reposQuery}`;

  const { data } = useSWR<PaginatedTopicCommitResponse, Error>(contributor ? endpointString : null);

  useEffect(() => {
    if (data && Array.isArray(data.data)) {
      const graphData = getCommitsLast30Days(data.data);

      setChart((prevChart) => ({
        ...prevChart,
        xAxis: {
          ...prevChart.xAxis,
          data: graphData.map((commit) => `${commit.x}`)
        },
        series: prevChart.series.map((cs) => ({
          ...cs,
          data: graphData.map((commit) => commit.y)
        }))
      }));
    }
  }, [data]);

  return {
    chart
  };
};

export { useTopicContributorCommits };
