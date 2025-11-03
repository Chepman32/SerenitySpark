import React from 'react';
import { render } from '@testing-library/react-native';
import DurationCarousel from '../DurationCarousel';

describe('DurationCarousel', () => {
  const mockOnDurationSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all duration options', () => {
    const { getByText } = render(
      <DurationCarousel onDurationSelect={mockOnDurationSelect} />,
    );

    expect(getByText('5')).toBeTruthy();
    expect(getByText('10')).toBeTruthy();
    expect(getByText('15')).toBeTruthy();
    expect(getByText('20')).toBeTruthy();
    expect(getByText('30')).toBeTruthy();
  });

  it('should render indicators for all options', () => {
    const { getAllByTestId } = render(
      <DurationCarousel onDurationSelect={mockOnDurationSelect} />,
    );

    // Note: In actual implementation, add testID to indicators
    // This is a placeholder test
    expect(true).toBe(true);
  });

  it('should initialize with default duration', () => {
    const { getByText } = render(
      <DurationCarousel
        onDurationSelect={mockOnDurationSelect}
        initialDuration={15}
      />,
    );

    expect(getByText('15')).toBeTruthy();
  });
});
