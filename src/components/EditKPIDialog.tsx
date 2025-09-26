"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog" // Import Radix primitives for the Portal and Overlay
import { Input } from "@/components/ui/input"
import type { KPI } from "@/types/database.types"
import { Pencil } from "lucide-react"
import { DatePicker } from "rsuite"
import { createClient } from "@/utils/supabase/client"

interface EditKPIDialogProps {
  kpi: KPI
  onKPIUpdated: (kpi: KPI) => void
}

export default function EditKPIDialog({ kpi, onKPIUpdated }: EditKPIDialogProps) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(kpi.title)
  const [measureDate, setMeasureDate] = useState<Date | null>(
    kpi.measure_date ? new Date(kpi.measure_date) : null
  )
  const [result, setResult] = useState(kpi.result)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      // Reset values when the dialog opens.
      setTitle(kpi.title)
      setMeasureDate(kpi.measure_date ? new Date(kpi.measure_date) : null)
      setResult(kpi.result)
    }
  }, [open, kpi])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from("kpis")
        .update({
          title,
          measure_date: measureDate?.toISOString(),
          result,
        })
        .eq("id", kpi.id)
        .select()
        .single()

      if (error) throw error

      if (data) {
        onKPIUpdated(data)
        setOpen(false)
      }
    } catch (error) {
      console.error("Error updating KPI:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="mr-2">
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      {/* Use the Portal from Radix UI to render the dialog outside the normal DOM flow */}
      <DialogPrimitive.Portal>
        {/* Overlay covers the entire viewport with a semi-transparent black background and a slight blur */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <DialogContent className="fixed top-1/2 left-1/2 z-50 w-full max-w-md transform -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle>Edit KPI Measurement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                KPI
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter KPI name"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium block">Measure Date</label>
              <DatePicker
                placeholder="Select measure date"
                style={{ width: "100%" }}
                value={measureDate}
                onChange={setMeasureDate}
                format="dd/MM/yyyy"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="result" className="text-sm font-medium">
                Result
              </label>
              <Input
                id="result"
                value={result}
                onChange={(e) => setResult(e.target.value)}
                placeholder="Enter measurement result"
                required
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </DialogPrimitive.Portal>
    </Dialog>
  )
}
