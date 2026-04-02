import { getComparableEventDate, isEventInPast } from './calendarUtils';

describe('calendarUtils past event detection', () => {
    it('treats an event earlier on the same day as past once its start time has passed', () => {
        const reference = new Date('2026-04-02T14:00:00+02:00');

        expect(isEventInPast('2026-04-02T10:30:00+00:00', reference)).toBe(true);
    });

    it('keeps a later same-day event as upcoming', () => {
        const reference = new Date('2026-04-02T14:00:00+02:00');

        expect(isEventInPast('2026-04-02T16:30:00+00:00', reference)).toBe(false);
    });

    it('combines a local date key with a start time for calendar entries', () => {
        const reference = new Date(2026, 3, 2, 16, 0, 0, 0);
        const eventDate = getComparableEventDate('2026-04-02', '15:00:00');

        expect(eventDate).toBeInstanceOf(Date);
        expect(isEventInPast('2026-04-02', reference, '15:00:00')).toBe(true);
        expect(isEventInPast('2026-04-02', reference, '18:00:00')).toBe(false);
    });
});
