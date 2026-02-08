import React, { useCallback, useMemo } from "react";

import { TextInput } from "grommet";
import { getCurrency } from "locale-currency";

const currentLocale = navigator.language || "en-US";
const localCurrency = getCurrency(currentLocale);

const CurrencyInput = React.forwardRef(({
  currency = localCurrency,
  locale = currentLocale,
  value,
  onChange,
  numberFormatOptions = {},
  ...rest
}, ref) => {
  const valueString = useMemo(() => `${value || ""}`, [value]);
  const { format } = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        ...numberFormatOptions,
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: numberFormatOptions.maximumFractionDigits || 2,
      }),
    [locale, numberFormatOptions, currency]
  );

  const decimalSeparator = useMemo(() => {
    const { format } = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: numberFormatOptions.currency || localCurrency,
    });

    return format(0.1).replace(/[^,.]/g, "");
  }, [locale, numberFormatOptions]);

  const maskedValue = useMemo(() => {
    if (!valueString || valueString === "-") {
      return valueString;
    }
    const lastChar = valueString.slice(-1);
    if (lastChar === "." || lastChar === ",") {
      return `${format(valueString.slice(0, -1))}${lastChar}`;
    }
    return format(valueString.replace(decimalSeparator, "."));
  }, [valueString, format, decimalSeparator]);

  const onInputChange = useCallback(
    (event, ...rest) => {
      let newValue = event.target.value.replace(
        new RegExp(`[^0-9${decimalSeparator}-]`, "g"),
        ""
      );
      if (
        newValue.endsWith(decimalSeparator) &&
        newValue.split(decimalSeparator).length > 2
      ) {
        newValue = newValue.slice(0, -1);
      }
      onChange &&
        onChange(
          {
            ...event,
            target: {
              ...event.target,
              value: newValue,
            },
          },
          ...rest
        );
    },
    [onChange, decimalSeparator]
  );
  return (
    <TextInput
      ref={ref}
      value={maskedValue}
      onChange={onInputChange}
      placeholder={`${format(5.55)}`}
      {...rest}
    />
  );
});

CurrencyInput.displayName = 'CurrencyInput';

export default CurrencyInput;
