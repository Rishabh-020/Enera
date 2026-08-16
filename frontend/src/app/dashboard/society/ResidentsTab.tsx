import { useEffect, useState, useMemo } from "react";
import { Search, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Input, Table, Thead, Th, Td, Tr, StatusDot } from "../../../components/ui/primitives";
import { CustomSelect } from "../../../components/ui/CustomSelect";
import type { SocietyFlatRow } from "../../../lib/types";
import { useWebSocketReading } from "../../../context/WebSocketContext";

interface ResidentsTabProps {
  flats: SocietyFlatRow[] | null;
  onSelectFlat: (id: string, flatNumber: string) => void;
}

export function ResidentsTab({ flats: initialFlats, onSelectFlat }: ResidentsTabProps) {
  const [search, setSearch] = useState("");
  const [blockFilter, setBlockFilter] = useState("All");
  const [bhkFilter, setBhkFilter] = useState("All");
  const [flats, setFlats] = useState<SocietyFlatRow[] | null>(initialFlats);

  const { latestReading } = useWebSocketReading();

  useEffect(() => {
    setFlats(initialFlats);
  }, [initialFlats]);

  useEffect(() => {
    if (!latestReading || !latestReading.flatId) return;

    setFlats((prev) =>
      prev
        ? prev.map((f) =>
            String(f.id) === String(latestReading.flatId) || (latestReading.flatNumber && f.flatNumber === latestReading.flatNumber)
              ? { ...f, meterStatus: "live", mtdKwh: Number((f.mtdKwh + (latestReading.kwh ?? 0.01)).toFixed(1)) }
              : f
          )
        : prev
    );
  }, [latestReading]);

  // Extract unique dynamic blocks from flats
  const blockOptions = useMemo(() => {
    const uniqueBlocks = Array.from(new Set((flats ?? []).map((f) => f.blockName).filter(Boolean)));
    const opts = [{ value: "All", label: "All Blocks" }];
    if (uniqueBlocks.length > 0) {
      uniqueBlocks.forEach((b) => opts.push({ value: b, label: b }));
    } else {
      opts.push(
        { value: "Block A", label: "Block A" },
        { value: "Block B", label: "Block B" },
        { value: "Block C", label: "Block C" },
        { value: "Block D", label: "Block D" }
      );
    }
    return opts;
  }, [flats]);

  const bhkOptions = [
    { value: "All", label: "All BHKs" },
    { value: "1BHK", label: "1 BHK" },
    { value: "2BHK", label: "2 BHK" },
    { value: "3BHK", label: "3 BHK" },
  ];

  const filtered = (flats ?? []).filter((f) => {
    const matchesSearch =
      f.flatNumber.toLowerCase().includes(search.toLowerCase()) ||
      (f.residentName || "").toLowerCase().includes(search.toLowerCase());
    const matchesBlock = blockFilter === "All" || f.blockName === blockFilter;
    const matchesBhk = bhkFilter === "All" || f.bhkType === bhkFilter;
    return matchesSearch && matchesBlock && matchesBhk;
  });

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Resident Directory</CardTitle>
          <CardDescription>Search and view flats, residents and live meters</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search resident or flat..." className="w-48 pl-9 h-9" />
          </div>
          <CustomSelect value={blockFilter} onChange={setBlockFilter} options={blockOptions} />
          <CustomSelect value={bhkFilter} onChange={setBhkFilter} options={bhkOptions} />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <Thead>
            <tr>
              <Th>Flat Number</Th>
              <Th>Block</Th>
              <Th>BHK Type</Th>
              <Th>Resident</Th>
              <Th>Meter Status</Th>
              <Th>MTD Consumption</Th>
              <Th></Th>
            </tr>
          </Thead>
          <tbody>
            {filtered.length === 0 ? (
              <Tr>
                <Td colSpan={7} className="text-center py-6 text-slate-400">
                  No residents found matching criteria
                </Td>
              </Tr>
            ) : (
              filtered.map((f) => (
                <Tr key={f.id} onClick={() => onSelectFlat(String(f.id), f.flatNumber)} className="cursor-pointer">
                  <Td className="font-semibold text-slate-800">{f.flatNumber}</Td>
                  <Td>{f.blockName}</Td>
                  <Td>{f.bhkType}</Td>
                  <Td>{f.residentName || <span className="text-slate-400 italic">Vacant</span>}</Td>
                  <Td>
                    <Badge variant={f.meterStatus === "live" ? "live" : "offline"}>
                      <StatusDot status={f.meterStatus} /> {f.meterStatus === "live" ? "Live" : "Offline"}
                    </Badge>
                  </Td>
                  <Td className="font-mono-data font-semibold">{f.mtdKwh?.toFixed(0) ?? "0"} kWh</Td>
                  <Td>
                    <ChevronRight size={15} className="text-slate-400" />
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </CardContent>
    </Card>
  );
}
