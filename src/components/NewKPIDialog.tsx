"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Input } from "@/components/ui/input"
import type { KPI } from "@/types/database.types"
import { Plus } from "lucide-react"
import { DatePicker } from "rsuite"
import { createClient } from "@/utils/supabase/client"

interface NewKPIDialogProps {
  projectId: string
  onKPICreated: (kpi: KPI) => void
}

export default function NewKPIDialog({ projectId, onKPICreated }: NewKPIDialogProps) {
  const supabase = useMemo(() => createClient(), [])
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [measureDate, setMeasureDate] = useState<Date | null>(null)
  const [result, setResult] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from("kpis")
        .insert([
          {
            project_id: projectId,
            title,
            measure_date: measureDate?.toISOString(),
            result,
          },
        ])
        .select()
        .single()

      if (error) throw error

      if (data) {
        onKPICreated(data)
        setTitle("")
        setMeasureDate(null)
        setResult("")
        setOpen(false)
      }
    } catch (error) {
      console.error("Error creating KPI:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add KPI
        </Button>
      </DialogTrigger>
      <DialogPrimitive.Portal>
        {/* Overlay to cover the entire viewport with a semi-transparent black background and blur */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <DialogContent className="fixed top-1/2 left-1/2 z-50 w-full max-w-md transform -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle>Add KPI Measurement</DialogTitle>
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
              <label className="text-sm font-medium block">
                Measure Date
              </label>
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
                {isLoading ? "Adding..." : "Add Measurement"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </DialogPrimitive.Portal>
    </Dialog>
  )
}
