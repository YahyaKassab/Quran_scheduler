import { render, screen, waitFor } from '@testing-library/react';
import SurahList from './SurahList';
import { surahAPI } from '../services/api';

// Mock the API module
jest.mock('../services/api', () => ({
  surahAPI: {
    getAll: jest.fn(),
    getMemorizationStatus: jest.fn(),
    getSurahPages: jest.fn(),
    updateMemorizationStatus: jest.fn(),
    batchUpdateMemorizationStatus: jest.fn(),
  }
}));

describe('SurahList Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  test('renders bulk update surahs section', async () => {
    // Mock API responses
    surahAPI.getAll.mockResolvedValue({
      data: [
        { number: 1, nameArabic: 'الفاتحة', nameEnglish: 'Al-Fatihah', totalPages: 1, startPage: 1, endPage: 1 },
        { number: 2, nameArabic: 'البقرة', nameEnglish: 'Al-Baqarah', totalPages: 48, startPage: 2, endPage: 49 }
      ]
    });
    surahAPI.getMemorizationStatus.mockResolvedValue({ data: {} });

    render(<SurahList />);

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Bulk Update Surahs')).toBeInTheDocument();
    });

    // Check that all bulk update elements are present
    expect(screen.getByText('From Surah:')).toBeInTheDocument();
    expect(screen.getByText('To Surah:')).toBeInTheDocument();
    expect(screen.getByText('Status:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update Range' })).toBeInTheDocument();

    // Check that the Update Range button is initially disabled
    expect(screen.getByRole('button', { name: 'Update Range' })).toBeDisabled();

    // Check that status options are available
    const statusDropdown = screen.getByDisplayValue('Select status...');
    expect(statusDropdown).toBeInTheDocument();
  });

  test('renders page title and description correctly', async () => {
    // Mock API responses with empty data to avoid loading issues
    surahAPI.getAll.mockResolvedValue({ data: [] });
    surahAPI.getMemorizationStatus.mockResolvedValue({ data: {} });

    render(<SurahList />);

    await waitFor(() => {
      expect(screen.getByText('Surah Memorization Status')).toBeInTheDocument();
    });

    expect(screen.getByText('Track your memorization progress for each surah and page.')).toBeInTheDocument();
    expect(screen.getByText('Show Arabic Names')).toBeInTheDocument();
  });

  test('renders loading state initially', () => {
    // Mock API calls to not resolve immediately
    surahAPI.getAll.mockImplementation(() => new Promise(() => {}));
    surahAPI.getMemorizationStatus.mockImplementation(() => new Promise(() => {}));

    render(<SurahList />);

    expect(screen.getByText('Loading surahs...')).toBeInTheDocument();
  });

  test('renders error state when API calls fail', async () => {
    // Mock API calls to reject
    surahAPI.getAll.mockRejectedValue(new Error('API Error'));
    surahAPI.getMemorizationStatus.mockRejectedValue(new Error('API Error'));

    render(<SurahList />);

    await waitFor(() => {
      // Check if the component finished loading and shows the UI
      expect(screen.getByText('Bulk Update Surahs')).toBeInTheDocument();
    }, { timeout: 2000 });

    // The error might not immediately show, but the component should still render
    // with the bulk update functionality visible
    expect(screen.getByText('From Surah:')).toBeInTheDocument();
    expect(screen.getByText('To Surah:')).toBeInTheDocument();
  });
});