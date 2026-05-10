// src/__tests__/PlaceCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import PlaceCard from '../components/places/PlaceCard';
import { Place } from '../types';

const samplePlace: Place = {
  id: 'place-1',
  userId: 'user-1',
  name: 'Le Petit Bistro',
  address: '12 Rue de Rivoli, Paris, France',
  lat: 48.8566,
  lng: 2.3522,
  category: 'Restaurant',
  hoursOverride: false,
  dedupeKey: 'gpid:test',
  tags: [{ tag: { id: 'tag-1', userId: 'user-1', name: 'romantic', createdAt: '2024-01-01T00:00:00.000Z' } }],
  notes: [],
  _count: { notes: 2 },
  createdAt: '2024-01-01T10:00:00.000Z',
  updatedAt: '2024-03-15T12:00:00.000Z',
};

describe('PlaceCard', () => {
  it('renders the place name', () => {
    render(<PlaceCard place={samplePlace} onClick={() => {}} />);
    expect(screen.getByText('Le Petit Bistro')).toBeInTheDocument();
  });

  it('renders the address', () => {
    render(<PlaceCard place={samplePlace} onClick={() => {}} />);
    expect(screen.getByText('12 Rue de Rivoli, Paris, France')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<PlaceCard place={samplePlace} onClick={handleClick} />);
    fireEvent.click(screen.getByTestId('place-card'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows category chip', () => {
    render(<PlaceCard place={samplePlace} onClick={() => {}} />);
    expect(screen.getByText('Restaurant')).toBeInTheDocument();
  });

  it('shows tag chips', () => {
    render(<PlaceCard place={samplePlace} onClick={() => {}} />);
    expect(screen.getByText('romantic')).toBeInTheDocument();
  });

  it('shows note count badge', () => {
    render(<PlaceCard place={samplePlace} onClick={() => {}} />);
    expect(screen.getByText(/2 notes/)).toBeInTheDocument();
  });
});
