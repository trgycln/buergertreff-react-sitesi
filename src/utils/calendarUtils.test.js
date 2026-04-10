import { getComparableEventDate, isEventInPast, mergeUpcomingEvents } from './calendarUtils';

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

describe('calendarUtils upcoming merge logic', () => {
    it('merges same-day `Offener Treff` entries from different calendar sources into one item', () => {
        const merged = mergeUpcomingEvents([
            {
                id: 'recurring-1',
                title: 'Offener Treff',
                category: 'Offene Treff',
                dateKey: '2026-04-15',
                startTime: '15:00:00',
                location: 'Marktstr. 8',
                description: '',
                linkTo: null,
                detailId: null,
            },
            {
                id: 'single-99',
                title: 'Offener Treff',
                category: 'Offener Treff',
                dateKey: '2026-04-15',
                startTime: '15:00:00',
                location: '',
                description: 'Gemeinsamer Nachmittag mit Austausch.',
                linkTo: '/angebote/99',
                detailId: 99,
            },
        ]);

        expect(merged).toHaveLength(1);
        expect(merged[0]).toMatchObject({
            title: 'Offener Treff',
            dateKey: '2026-04-15',
            startTime: '15:00:00',
            location: 'Marktstr. 8',
            linkTo: '/angebote/99',
            detailId: 99,
        });
        expect(merged[0].description).toContain('Gemeinsamer Nachmittag');
    });

    it('keeps different events on the same day separate when their titles differ', () => {
        const merged = mergeUpcomingEvents([
            {
                id: 'event-1',
                title: 'Offener Treff',
                category: 'Offene Treff',
                dateKey: '2026-04-15',
            },
            {
                id: 'event-2',
                title: 'Spieletreff',
                category: 'Freizeit',
                dateKey: '2026-04-15',
            },
        ]);

        expect(merged).toHaveLength(2);
    });
});
