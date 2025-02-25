import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";

import Avatar from "components/atoms/Avatar/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "components/atoms/Tabs/tabs";
import HighlightInputForm from "components/molecules/HighlightInput/highlight-input-form";
import Text from "components/atoms/Typography/text";
import { getFormattedDate, getRelativeDays } from "lib/utils/date-utils";
import Pill from "components/atoms/Pill/pill";
import CardLineChart from "components/molecules/CardLineChart/card-line-chart";
import CardRepoList, { RepoList } from "components/molecules/CardRepoList/card-repo-list";
import PullRequestTable from "components/molecules/PullRequestTable/pull-request-table";
import ContributorHighlightCard from "components/molecules/ContributorHighlight/contributor-highlight-card";
import { useFetchUserHighlights } from "lib/hooks/useFetchUserHighlights";
import Button from "components/atoms/Button/button";
import useSupabaseAuth from "lib/hooks/useSupabaseAuth";
import uppercaseFirst from "lib/utils/uppercase-first";
import Link from "next/link";
import PaginationResults from "components/molecules/PaginationResults/pagination-result";
import Pagination from "components/molecules/Pagination/pagination";

interface ContributorProfileTabProps {
  contributor?: DbUser;
  prTotal: number;
  openPrs: number;
  prVelocity: number;
  prMerged: number;
  recentContributionCount: number;
  prsMergedPercentage: number;
  chart: Object;
  githubName: string;
  repoList: RepoList[];
}

const ContributorProfileTab = ({
  contributor,
  openPrs,
  prMerged,
  prTotal,
  prVelocity,
  prsMergedPercentage,
  chart,
  githubName,
  recentContributionCount,
  repoList
}: ContributorProfileTabProps): JSX.Element => {
  const { login } = contributor || {};
  const { user } = useSupabaseAuth();

  const { data: highlights, isError, isLoading, mutate, meta, setPage } = useFetchUserHighlights(login || "");
  const [inputVisible, setInputVisible] = useState(false);
  const pathnameRef = useRef<string | null>();

  const router = useRouter();

  const hasHighlights = highlights?.length > 0;
  pathnameRef.current = router.pathname.split("/").at(-1);

  const currentPathname =
    pathnameRef.current !== "[username]" ? pathnameRef.current : hasHighlights ? "highlights" : "contributions";

  const handleTabUrl = (tab: string) => {
    router.push(`/user/${login}/${tab.toLowerCase()}`);
  };

  useEffect(() => {
    setInputVisible(highlights && highlights.length !== 0 ? true : false);
    if (currentPathname) {
      router.push(`/user/${login}/${currentPathname}`);
    }
  }, [highlights]);

  return (
    <Tabs defaultValue={uppercaseFirst(currentPathname as string)} className="">
      <TabsList className="w-full border-b  justify-start">
        <TabsTrigger
          className="data-[state=active]:border-sauced-orange data-[state=active]:border-b-2 text-2xl"
          value="Highlights"
          onClick={() => handleTabUrl("Highlights")}
        >
          Highlights
        </TabsTrigger>
        <TabsTrigger
          className="data-[state=active]:border-sauced-orange data-[state=active]:border-b-2 text-2xl"
          value="Contributions"
          onClick={() => handleTabUrl("Contributions")}
        >
          Contributions
        </TabsTrigger>
      </TabsList>

      {/* Highlights Tab details */}

      <TabsContent value="Highlights">
        {inputVisible && user?.user_metadata.user_name === login && (
          <div className="lg:pl-20 lg:gap-x-3 pt-4 flex max-w-[48rem]">
            <div className="hidden lg:inline-flex">
              <Avatar
                alt="user profile avatar"
                size="sm"
                avatarURL={`https://www.github.com/${githubName}.png?size=300`}
              />
            </div>

            <HighlightInputForm refreshCallback={mutate} />
          </div>
        )}
        <div className="mt-8 flex flex-col gap-8">
          {/* <HightlightEmptyState /> */}

          {isError && <>An error occured</>}
          {isLoading ? (
            <>Loading...</>
          ) : (
            <>
              {!isError && highlights && highlights.length > 0 ? (
                <div>
                  {/* eslint-disable-next-line camelcase */}
                  {highlights.map(({ id, title, highlight, url, created_at }) => (
                    <div className="flex gap-2 flex-col lg:flex-row lg:gap-7" key={id}>
                      <Link href={`/feed/${id}`}>
                        <p className="text-light-slate-10 text-sm">{getFormattedDate(created_at)}</p>
                      </Link>
                      <ContributorHighlightCard
                        id={id}
                        user={login || ""}
                        title={title}
                        desc={highlight}
                        prLink={url}
                        refreshCallBack={mutate}
                      />
                    </div>
                  ))}
                  {meta.pageCount > 1 && (
                    <div className="mt-10 max-w-[48rem] flex px-2 items-center justify-between">
                      <div>
                        <PaginationResults metaInfo={meta} total={meta.itemCount} entity={"highlights"} />
                      </div>
                      <Pagination
                        pages={[]}
                        totalPage={meta.pageCount}
                        page={meta.page}
                        pageSize={meta.itemCount}
                        goToPage
                        hasNextPage={meta.hasNextPage}
                        hasPreviousPage={meta.hasPreviousPage}
                        onPageChange={function (page: number): void {
                          setPage(page);
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex justify-center rounded-xl border border-dashed border-light-slate-8 px-6 lg:px-32 py-20 items-center">
                  <div className="text-center">
                    {user?.user_metadata.user_name === login ? (
                      <>
                        <p>
                          You don&apos;t have any highlights yet! <br /> Highlights are a great way to show off your
                          contributions. Merge any pull requests recently?
                        </p>
                        {!inputVisible && (
                          <Button onClick={() => setInputVisible(true)} className="mt-5" variant="primary">
                            Add a highlight
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        <p>{` ${login} hasn't posted any highlights yet!`}</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </TabsContent>

      {/* Contributions Tab Details */}

      <TabsContent value="Contributions">
        <div className="mt-4">
          <div className="bg-white mt-4 rounded-2xl border p-4 md:p-6">
            <div className=" flex flex-col lg:flex-row gap-2 md:gap-12 lg:gap-16 justify-between">
              <div>
                <span className="text-xs text-light-slate-11">PRs opened</span>
                {openPrs ? (
                  <div className="flex lg:justify-center md:pr-8 mt-1">
                    <Text className="!text-lg md:!text-xl lg:!text-2xl !text-black !leading-none">{openPrs} PRs</Text>
                  </div>
                ) : (
                  <div className="flex justify-center items-end mt-1"> - </div>
                )}
              </div>
              <div>
                <span className="text-xs text-light-slate-11">Avg PRs velocity</span>
                {prVelocity ? (
                  <div className="flex gap-2 lg:justify-center items-center">
                    <Text className="!text-lg md:!text-xl lg:!text-2xl !text-black !leading-none">
                      {getRelativeDays(prVelocity)}
                    </Text>

                    <Pill color="purple" text={`${prsMergedPercentage}%`} />
                  </div>
                ) : (
                  <div className="flex justify-center items-end mt-1"> - </div>
                )}
              </div>
              <div>
                <span className="text-xs text-light-slate-11">Contributed Repos</span>
                {recentContributionCount ? (
                  <div className="flex lg:justify-center mt-1">
                    <Text className="!text-lg md:!text-xl lg:!text-2xl !text-black !leading-none">
                      {`${recentContributionCount} Repo${recentContributionCount > 1 ? "s" : ""}`}
                    </Text>
                  </div>
                ) : (
                  <div className="flex justify-center items-end mt-1"> - </div>
                )}
              </div>
            </div>
            <div className="mt-10 h-32">
              <CardLineChart lineChartOption={chart} className="!h-32" />
            </div>
            <div>
              <CardRepoList limit={7} repoList={repoList} />
            </div>

            <div className="mt-6">
              <PullRequestTable limit={15} contributor={githubName} topic={"*"} repositories={undefined} />
            </div>
            <div className="mt-8 text-light-slate-9 text-sm">
              <p>The data for these contributions is from publicly available open source projects on GitHub.</p>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default ContributorProfileTab;
