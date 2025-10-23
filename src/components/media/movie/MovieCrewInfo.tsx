interface CrewMember {
  role: string;
  name: string;
}

interface MovieCrewInfoProps {
  director?: string | null;
  producer?: string | null;
  cinematographer?: string | null;
  writer?: string | null;
  mediaType: "movie" | "tv";
}

export function MovieCrewInfo({
  director,
  producer,
  cinematographer,
  writer,
  mediaType,
}: MovieCrewInfoProps) {
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
        <p key={member.role} className="text-gray-700 dark:text-gray-300">
          <span className="font-normal text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {member.role}:
          </span>{" "}
          <span className="font-medium">{member.name}</span>
        </p>
      ))}
    </div>
  );
}
