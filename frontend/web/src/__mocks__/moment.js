const moment = jest.fn((date) => ({
  format: jest.fn((formatString) => {
    // Mock different date formatting based on format string
    if (formatString === 'MM/DD/YYYY') return '06/15/2023';
    if (formatString === 'MM-DD-YYYY') return '06-15-2023';
    if (formatString === 'MM.DD.YYYY') return '06.15.2023';
    if (formatString === 'MMDDYYYY') return '06152023';
    if (formatString === 'DD/MM/YYYY') return '15/06/2023';
    if (formatString === 'DD-MM-YYYY') return '15-06-2023';
    if (formatString === 'DD.MM.YYYY') return '15.06.2023';
    if (formatString === 'DDMMYYYY') return '15062023';
    return '15/06/2023'; // default
  })
}));

module.exports = moment;
