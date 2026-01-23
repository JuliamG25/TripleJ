import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, isBefore, startOfDay, type Locale } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Button } from "./Button"

export interface CalendarProps {
  selected?: Date
  onSelect?: (date: Date) => void
  month?: Date
  onMonthChange?: (date: Date) => void
  modifiers?: {
    [key: string]: (date: Date) => boolean
  }
  modifiersClassNames?: {
    [key: string]: string
  }
  className?: string
  locale?: Locale
  disabled?: (date: Date) => boolean
}

const daysOfWeek = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export function Calendar({
  selected,
  onSelect,
  month = new Date(),
  onMonthChange,
  modifiers = {},
  modifiersClassNames = {},
  className,
  locale = es,
  disabled,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(month)

  React.useEffect(() => {
    setCurrentMonth(month)
  }, [month])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const startDate = startOfWeek(monthStart, { locale })
  const endDate = endOfWeek(monthEnd, { locale })

  const days: Date[] = []
  let day = startDate
  while (day <= endDate) {
    days.push(day)
    day = addDays(day, 1)
  }

  const previousMonth = () => {
    const newMonth = subMonths(currentMonth, 1)
    setCurrentMonth(newMonth)
    onMonthChange?.(newMonth)
  }

  const nextMonth = () => {
    const newMonth = addMonths(currentMonth, 1)
    setCurrentMonth(newMonth)
    onMonthChange?.(newMonth)
  }

  const getModifierClassNames = (date: Date): string => {
    const classes: string[] = []
    // Prioridad: hasOverdue > hasPending > allCompleted > hasTasks
    const priorityOrder = ['hasOverdue', 'hasPending', 'allCompleted', 'hasTasks']
    
    for (const modifier of priorityOrder) {
      if (modifiers[modifier] && modifiers[modifier](date)) {
        const className = modifiersClassNames[modifier]
        if (className) {
          classes.push(className)
          // Solo aplicar el primer modificador encontrado (el de mayor prioridad)
          break
        }
      }
    }
    
    return classes.join(' ')
  }

  return (
    <div className={cn("p-3", className)}>
      {/* Header con navegación */}
      <div className="flex justify-center items-center mb-4 relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={previousMonth}
          className="absolute left-1 h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-base font-semibold text-foreground">
          {format(currentMonth, "MMMM yyyy", { locale })}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={nextMonth}
          className="absolute right-1 h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabla del calendario */}
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {daysOfWeek.map((day, i) => (
              <th
                key={i}
                className="text-muted-foreground rounded-md font-semibold text-xs uppercase tracking-wider text-center pb-2"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: Math.ceil(days.length / 7) }).map((_, weekIndex) => (
            <tr key={weekIndex}>
              {days.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => {
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isSelected = selected && isSameDay(day, selected)
                const isToday = isSameDay(day, new Date())
                const isPast = isBefore(startOfDay(day), startOfDay(new Date()))
                const isDisabled = disabled ? disabled(day) : false
                const modifierClasses = getModifierClassNames(day)

                return (
                  <td
                    key={dayIndex}
                    className={cn(
                      "h-10 w-[14.28%] p-0 relative text-center align-middle",
                      !isCurrentMonth && "opacity-40"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => !isDisabled && onSelect?.(day)}
                      disabled={isDisabled}
                      className={cn(
                        "h-10 w-10 mx-auto font-medium rounded-lg transition-all duration-200 flex items-center justify-center text-sm relative",
                        isSelected && "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md scale-105 font-semibold",
                        !isSelected && isToday && "bg-accent text-accent-foreground font-semibold border-2 border-primary/30",
                        !isSelected && !isToday && !isPast && "hover:bg-accent/50",
                        isPast && !isSelected && "opacity-60 text-muted-foreground",
                        isPast && !isSelected && "hover:bg-muted/30",
                        isDisabled && "opacity-30 cursor-not-allowed",
                        modifierClasses
                      )}
                    >
                      {format(day, "d")}
                      {isPast && !isSelected && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-muted-foreground/50"></span>
                      )}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
