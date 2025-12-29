interface CrewMember {
  role: string;
  name: string;
}

interface MediaCrewInfoProps {
  director?: string | null;
  producer?: string | null;
  cinematographer?: string | null;
  writer?: string | null;
  mediaType: "movie" | "tv";
}

export function MediaCrewInfo({
  director,
  producer,
  cinematographer,
  writer,
  mediaType,
}: MediaCrewInfoProps) {
  const crew: CrewMember[] = [
    {
      role: mediaType === "tv" ? "Creator" : "Director",
      name: director || "",
    },
    { role: "Producer", name: producer || "" },
    { role: "Cinematographer", name: cinematographer || "" },
    { role: "Writer", name: writer || "" },
  ].filter((member) => member.name);

  if (crew.length === 0) return null;

  return (
    <div className="space-y-1.5 text-sm">
      {crew.map((member) => (
        <p
          key={member.role}
          className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 m-0"
        >
          <span className="font-normal metadata-label">{member.role}:</span>{" "}
          <span className="font-medium">{member.name}</span>
        </p>
      ))}
    </div>
  );
}
