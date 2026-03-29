export const WEEKDAY_OPTIONS = [
    { value: 1, label: 'Mo', longLabel: 'Montag' },
    { value: 2, label: 'Di', longLabel: 'Dienstag' },
    { value: 3, label: 'Mi', longLabel: 'Mittwoch' },
    { value: 4, label: 'Do', longLabel: 'Donnerstag' },
    { value: 5, label: 'Fr', longLabel: 'Freitag' },
    { value: 6, label: 'Sa', longLabel: 'Samstag' },
    { value: 0, label: 'So', longLabel: 'Sonntag' },
];

const pad = (value) => String(value).padStart(2, '0');

export const parseLocalDate = (value) => {
    if (!value) return null;

    if (value instanceof Date) {
        return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12, 0, 0, 0);
    }

    const [year, month, day] = String(value).split('-').map(Number);
    if (!year || !month || !day) return null;

    return new Date(year, month - 1, day, 12, 0, 0, 0);
};

export const dateToKey = (date) => {
    const localDate = parseLocalDate(date);
    if (!localDate) return '';

    return `${localDate.getFullYear()}-${pad(localDate.getMonth() + 1)}-${pad(localDate.getDate())}`;
};

export const formatMonthTitle = (date) => {
    return date.toLocaleDateString('de-DE', {
        month: 'long',
        year: 'numeric',
    });
};

export const formatDateLabel = (date) => {
    return date.toLocaleDateString('de-DE', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
};

export const formatTimeRange = (startTime, endTime) => {
    const start = startTime ? String(startTime).slice(0, 5) : '';
    const end = endTime ? String(endTime).slice(0, 5) : '';

    if (start && end) return `${start} - ${end} Uhr`;
    if (start) return `ab ${start} Uhr`;
    if (end) return `bis ${end} Uhr`;
    return 'Uhrzeit folgt';
};

export const formatWeekdayList = (weekdays = []) => {
    const normalized = weekdays.map(Number);
    return WEEKDAY_OPTIONS.filter((option) => normalized.includes(option.value))
        .map((option) => option.longLabel)
        .join(', ');
};

const normalizeRecurrenceUnit = (value) => (String(value || '').toLowerCase() === 'month' ? 'month' : 'week');

const normalizeRecurrenceInterval = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1) return 1;
    return Math.floor(parsed);
};

const getMonthsBetween = (startDate, endDate) => {
    return (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
};

export const formatRecurrenceRule = (entry = {}) => {
    const recurrenceUnit = normalizeRecurrenceUnit(entry.recurrence_unit);
    const recurrenceInterval = normalizeRecurrenceInterval(entry.recurrence_interval);

    if (recurrenceUnit === 'month') {
        return recurrenceInterval === 1 ? 'Monatlich' : `Alle ${recurrenceInterval} Monate`;
    }

    const weekdayLabel = formatWeekdayList(entry.weekdays || []);
    const intervalLabel = recurrenceInterval === 1 ? 'Wöchentlich' : `Alle ${recurrenceInterval} Wochen`;
    return weekdayLabel ? `${intervalLabel} (${weekdayLabel})` : intervalLabel;
};

export const getCalendarGridDays = (currentMonth) => {
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
    const gridStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1 - startOffset, 12, 0, 0, 0);
    const todayKey = dateToKey(new Date());

    return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + index);

        return {
            date,
            key: dateToKey(date),
            isToday: dateToKey(date) === todayKey,
            inCurrentMonth: date.getMonth() === currentMonth.getMonth(),
        };
    });
};

export const expandRecurringEntries = (seriesEntries = [], rangeStart, rangeEnd) => {
    const occurrences = [];
    const millisecondsPerDay = 24 * 60 * 60 * 1000;

    seriesEntries.forEach((entry) => {
        const entryStart = parseLocalDate(entry.start_date);
        const entryEnd = parseLocalDate(entry.end_date);

        if (!entryStart || !entryEnd || entryEnd < rangeStart || entryStart > rangeEnd) {
            return;
        }

        const weekdays = Array.isArray(entry.weekdays) ? entry.weekdays.map(Number) : [];
        const recurrenceUnit = normalizeRecurrenceUnit(entry.recurrence_unit);
        const recurrenceInterval = normalizeRecurrenceInterval(entry.recurrence_interval);
        const effectiveStart = entryStart > rangeStart ? new Date(entryStart) : new Date(rangeStart);
        const effectiveEnd = entryEnd < rangeEnd ? new Date(entryEnd) : new Date(rangeEnd);
        const anchorDayOfMonth = entryStart.getDate();

        for (let cursor = new Date(effectiveStart); cursor <= effectiveEnd; cursor.setDate(cursor.getDate() + 1)) {
            if (recurrenceUnit === 'month') {
                const monthsElapsed = getMonthsBetween(entryStart, cursor);

                if (monthsElapsed < 0 || monthsElapsed % recurrenceInterval !== 0) {
                    continue;
                }

                if (cursor.getDate() !== anchorDayOfMonth) {
                    continue;
                }
            } else {
                if (!weekdays.includes(cursor.getDay())) {
                    continue;
                }

                const daysElapsed = Math.floor((cursor.getTime() - entryStart.getTime()) / millisecondsPerDay);
                const weeksElapsed = Math.floor(daysElapsed / 7);
                if (weeksElapsed % recurrenceInterval !== 0) {
                    continue;
                }
            }

            const dateKey = dateToKey(cursor);

            occurrences.push({
                id: `recurring-${entry.id}-${dateKey}`,
                sourceType: 'recurring',
                sourceId: entry.id,
                dateKey,
                title: entry.title,
                category: entry.category,
                location: entry.location,
                description: entry.description,
                startTime: entry.start_time,
                endTime: entry.end_time,
                color: entry.color || 'red',
            });
        }
    });

    return occurrences;
};

export const sortCalendarItems = (items = []) => {
    return [...items].sort((left, right) => {
        const leftTime = left.startTime || '99:99';
        const rightTime = right.startTime || '99:99';

        if (leftTime !== rightTime) {
            return leftTime.localeCompare(rightTime);
        }

        return String(left.title || '').localeCompare(String(right.title || ''), 'de');
    });
};