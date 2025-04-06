export const STYLES = {
  item: {
    active: "bg-[#a668ff] text-neutral-950",
    highlighted: "bg-[#1f1f1f] text-[#333333]",
    today: "bg-[#333333] border border-[#68ffd1] text-[#68ffd1]",
    default: "border border-[#333333] text-[#333333]",
  },
};


export function formatTimeRemaining(endDateString: string): string {
  // Parse the end date
  const endDate = new Date(endDateString);

  // Get current date
  const currentDate = new Date();

  // Calculate the time difference in milliseconds
  let timeDiff = endDate.getTime() - currentDate.getTime();

  // If the end date has passed, return a message indicating it's ended
  if (timeDiff <= 0) {
    return "Ended";
  }

  // Calculate days, hours, and minutes
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  timeDiff -= days * (1000 * 60 * 60 * 24);

  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  timeDiff -= hours * (1000 * 60 * 60);

  const minutes = Math.floor(timeDiff / (1000 * 60));

  // Format the string
  return `Ends in: ${days}D ${hours}H ${minutes}M`;
}
