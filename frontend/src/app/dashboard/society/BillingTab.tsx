import { useState } from "react";
import { Download } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Select, Table, Thead, Th, Td, Tr, Button } from "../../../components/ui/primitives";
import type { SocietyFlatRow } from "../../../lib/types";

export function BillingTab({ flats }: { flats: SocietyFlatRow[] | null }) {
  const [selectedMonth, setSelectedMonth] = useState("August 2026");

  const billingData = (flats ?? []).map((f) => {
    const kwh = f.mtdKwh ?? 0;
    const amount = kwh * 8; // ₹8 per kWh
    const dueDate = "25 Aug 2026";
    const isPaid = kwh % 3 !== 0; // Simulate paid/unpaid status
    return {
      flatNumber: f.flatNumber,
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
          <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="h-9 text-xs">
            <option>August 2026</option>
            <option>July 2026</option>
            <option>June 2026</option>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <Thead>
              <tr>
                <Th>Flat</Th>
                <Th>Resident</Th>
                <Th>Consumption</Th>
                <Th>Amount Due</Th>
                <Th>Due Date</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </Thead>
            <tbody>
              {billingData.map((b) => (
                <Tr key={b.flatNumber}>
                  <Td className="font-semibold text-slate-800">{b.flatNumber}</Td>
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
                          Remind
                        </Button>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
