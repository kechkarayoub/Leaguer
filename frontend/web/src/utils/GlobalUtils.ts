import moment from "moment";

export const renderDate = (date: Date, currentLanguage: string, separator: string = '/'): string => {
  let format = `DD${separator}MM${separator}YYYY`; // Default format
  if (currentLanguage === 'en') {
    format = `MM${separator}DD${separator}YYYY`; // US format
  }
  else if (currentLanguage === 'fr') {
    format = `DD${separator}MM${separator}YYYY`; // French format
  }
  else if (currentLanguage === 'ar') {
    format = `DD${separator}MM${separator}YYYY`; // Arabic format
  }
  return moment(date).format(format);
};
