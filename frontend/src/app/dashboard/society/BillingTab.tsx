import { useState } from "react";
import { Download, Send } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Table, Thead, Th, Td, Tr, Button } from "../../../components/ui/primitives";
import { CustomSelect } from "../../../components/ui/CustomSelect";
import type { SocietyFlatRow } from "../../../lib/types";

export function BillingTab({ flats }: { flats: SocietyFlatRow[] | null }) {
  const [selectedMonth, setSelectedMonth] = useState("August 2026");

  const billingData = (flats ?? []).map((f, idx) => {
    const kwh = f.mtdKwh ?? 0;
    const amount = kwh * 8; // ₹8 per kWh
    const dueDate = "25 Aug 2026";
    const isPaid = kwh % 3 !== 0; // Simulate paid/unpaid status
    return {
      id: f.id ?? `flat-${idx}`,
      flatNumber: f.flatNumber,
      blockName: f.blockName || "—",
      residentName: f.residentName || "Vacant",
      kwh: kwh.toFixed(0),
      amount: amount.toLocaleString("en-IN"),
      dueDate,
      status: isPaid ? "Paid" : "Overdue",
    };
  });

  const totalBillAmount = billingData.reduce((sum, item) => sum + parseFloat(item.amount.replace(/,/g, "")), 0);
  const totalPaid = billingData.filter((item) => item.status === "Paid").reduce((sum, item) => sum + parseFloat(item.amount.replace(/,/g, "")), 0);
  const unpaidCount = billingData.filter((item) => item.status !== "Paid").length;

  return (
    <div className="flex flex-col gap-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex flex-col justify-between h-[100px]">
          <span className="text-xs text-slate-500">Total Billing (This Month)</span>
          <span className="text-2xl font-bold text-slate-800">₹{totalBillAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
        </Card>
        <Card className="p-5 flex flex-col justify-between h-[100px]">
          <span className="text-xs text-slate-500">Collections (Paid)</span>
          <span className="text-2xl font-bold text-teal-600">₹{totalPaid.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
        </Card>
        <Card className="p-5 flex flex-col justify-between h-[100px]">
          <span className="text-xs text-slate-500">Outstanding Invoices</span>
          <span className="text-2xl font-bold text-red-500">{unpaidCount} Flats</span>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Invoices for {selectedMonth}</CardTitle>
            <CardDescription>View, download or trigger reminders for monthly energy bills</CardDescription>
          </div>
          <CustomSelect
            value={selectedMonth}
            onChange={setSelectedMonth}
            options={["August 2026", "July 2026", "June 2026"]}
          />
        </CardHeader>
        <CardContent>
          <Table>
            <Thead>
              <tr>
                <Th>Flat</Th>
                <Th>Block</Th>
                <Th>Resident</Th>
                <Th>Consumption</Th>
                <Th>Amount Due</Th>
                <Th>Due Date</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </Thead>
            <tbody>
              {billingData.length === 0 ? (
                <Tr>
                  <Td colSpan={8} className="text-center py-6 text-slate-400">
                    No flats registered for billing
                  </Td>
                </Tr>
              ) : (
                billingData.map((b) => (
                  <Tr key={b.id}>
                    <Td className="font-semibold text-slate-800">{b.flatNumber}</Td>
                    <Td className="text-slate-600">{b.blockName}</Td>
                    <Td>{b.residentName}</Td>
                    <Td className="font-mono-data">{b.kwh} kWh</Td>
                    <Td className="font-semibold">₹{b.amount}</Td>
                    <Td className="text-xs text-slate-500">{b.dueDate}</Td>
                    <Td>
                      <Badge variant={b.status === "Paid" ? "live" : "high"}>{b.status}</Badge>
                    </Td>
                    <Td>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => alert("Downloading PDF Invoice for " + b.flatNumber)}>
                          <Download size={12} /> PDF
                        </Button>
                        {b.status !== "Paid" && (
                          <Button size="sm" variant="amber" onClick={() => alert("Reminder sent to resident of " + b.flatNumber)}>
                            <Send size={12} /> Remind
                          </Button>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))
              )}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
