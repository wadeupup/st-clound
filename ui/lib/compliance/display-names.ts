export const getComplianceDisplayName = (name: string | undefined) => {
  if (!name) return "";

  if (name === "ProwlerThreatScore") {
    return "ST Cloud ThreatScore";
  }

  return name.split("-").join(" ");
};
