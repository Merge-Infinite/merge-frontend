"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Close, Dropdown, Search, Checkbox } from "@/components/icons";
import { useState, useMemo } from "react";
import { NBA_TEAMS_BY_TIER, getAllTeams } from "@/data/nba-teams";

type SortOption = "newest" | "oldest";

interface NbaFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTeams: string[];
  onSelectedTeamsChange: (teams: string[]) => void;
  sortBy: SortOption;
  onSortByChange: (sort: SortOption) => void;
  onApply: () => void;
  onClearAll: () => void;
  teamCounts?: Record<string, number>;
}

export default function NbaFilterSheet({
  open,
  onOpenChange,
  selectedTeams,
  onSelectedTeamsChange,
  sortBy,
  onSortByChange,
  onApply,
  onClearAll,
  teamCounts = {},
}: NbaFilterSheetProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showTeamSection, setShowTeamSection] = useState(true);
  const [showSortSection, setShowSortSection] = useState(true);

  // Get all teams from the data
  const allTeams = useMemo(() => getAllTeams(), []);

  // Filter teams based on search query
  const filteredTeams = useMemo(() => {
    if (!searchQuery) return allTeams;
    return allTeams.filter((team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allTeams, searchQuery]);

  const handleTeamToggle = (teamId: string) => {
    if (selectedTeams.includes(teamId)) {
      onSelectedTeamsChange(selectedTeams.filter((id) => id !== teamId));
    } else {
      onSelectedTeamsChange([...selectedTeams, teamId]);
    }
  };

  const handleApply = () => {
    onApply();
    onOpenChange(false);
  };

  const handleClearAll = () => {
    onClearAll();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showClose={false} className="h-[80vh] p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-0 h-11">
          <p className="text-sm font-semibold font-['Sora'] text-white uppercase tracking-wider">
            Filters
          </p>
          <button
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center"
          >
            <Close size={24} color="#858585" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4 px-4 pt-3 h-[calc(100%-44px-88px)] overflow-y-auto">
          {/* NBA Team Section */}
          <div className="flex flex-col gap-2">
            {/* Accordion Header */}
            <button
              onClick={() => setShowTeamSection(!showTeamSection)}
              className="flex items-center justify-between w-full"
            >
              <p className="text-sm font-bold font-['Sora'] text-white">
                NBA Team
              </p>
              <Dropdown
                size={24}
                color="white"
                className={`transition-transform duration-200 ${
                  showTeamSection ? "" : "rotate-180"
                }`}
              />
            </button>

            {showTeamSection && (
              <>
                {/* Search Input */}
                <div className="bg-[#141414] border border-[#333333] rounded-full px-3 py-2 flex items-center gap-4">
                  <Search size={24} color="#5c5c5c" />
                  <input
                    type="text"
                    placeholder="Search team..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-sm font-['Sora'] text-white placeholder:text-[#5c5c5c] outline-none"
                  />
                </div>

                {/* Team List */}
                <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto">
                  {filteredTeams.map((team) => (
                    <button
                      key={team.teamId}
                      onClick={() => handleTeamToggle(team.teamId)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#1f1f1f] transition-colors"
                    >
                      <Checkbox
                        size={24}
                        checked={selectedTeams.includes(team.teamId)}
                      />
                      <span className="flex-1 text-sm font-['Sora'] text-[#adadad] text-left">
                        {team.name}
                      </span>
                      <span className="text-sm font-['Sora'] text-white">
                        {teamCounts[team.teamId] || 0}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-[#292929]" />

          {/* Sort By Section */}
          <div className="flex flex-col gap-2">
            {/* Accordion Header */}
            <button
              onClick={() => setShowSortSection(!showSortSection)}
              className="flex items-center justify-between w-full"
            >
              <p className="text-sm font-bold font-['Sora'] text-white">
                Sort by
              </p>
              <Dropdown
                size={24}
                color="white"
                className={`transition-transform duration-200 ${
                  showSortSection ? "" : "rotate-180"
                }`}
              />
            </button>

            {showSortSection && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => onSortByChange("newest")}
                  className={`w-full px-3 py-2 rounded-lg text-left text-sm font-['Sora'] ${
                    sortBy === "newest"
                      ? "bg-[#a768ff]/20 text-[#a768ff]"
                      : "bg-[#1f1f1f] text-[#adadad]"
                  }`}
                >
                  Mint Date (Newest – Oldest)
                </button>
                <button
                  onClick={() => onSortByChange("oldest")}
                  className={`w-full px-3 py-2 rounded-lg text-left text-sm font-['Sora'] ${
                    sortBy === "oldest"
                      ? "bg-[#a768ff]/20 text-[#a768ff]"
                      : "bg-[#1f1f1f] text-[#adadad]"
                  }`}
                >
                  Mint Date (Oldest - Newest)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-3 px-4 pb-8 pt-4">
          <button
            onClick={handleClearAll}
            className="flex-1 h-10 bg-[#141414] border border-[#333333] rounded-3xl flex items-center justify-center"
          >
            <span className="text-sm font-semibold font-['Sora'] text-white uppercase tracking-wider">
              Clear all
            </span>
          </button>
          <button
            onClick={handleApply}
            className="flex-1 h-10 bg-[#a768ff] border border-[#292929] rounded-3xl flex items-center justify-center"
          >
            <span className="text-sm font-semibold font-['Sora'] text-white uppercase tracking-wider">
              Apply
            </span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
