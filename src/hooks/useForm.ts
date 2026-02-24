// Generic form handling hook with validation

import { useState, useCallback } from 'react';

type ValidationRule<T = any> = {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | null;
};

type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validationRules?: ValidationRules<T>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback(
    (name: keyof T, value: any): string | null => {
      if (!validationRules || !validationRules[name]) return null;

      const rules = validationRules[name]!;

      if (rules.required && (value === null || value === undefined || value === '')) {
        return 'This field is required';
      }

      if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
        return `Minimum value is ${rules.min}`;
      }

      if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
        return `Maximum value is ${rules.max}`;
      }

      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        return 'Invalid format';
      }

      if (rules.custom) {
        return rules.custom(value);
      }

      return null;
    },
    [validationRules]
  );

  const handleChange = useCallback(
    (name: keyof T, value: any) => {
      setValues((prev) => ({ ...prev, [name]: value }));

      // Validate on change if field has been touched
      if (touched[name]) {
        const error = validateField(name, value);
        setErrors((prev) => ({ ...prev, [name]: error || undefined }));
      }
    },
    [touched, validateField]
  );

  const handleBlur = useCallback(
    (name: keyof T) => {
      setTouched((prev) => ({ ...prev, [name]: true }));

      // Validate on blur
      const error = validateField(name, values[name]);
      setErrors((prev) => ({ ...prev, [name]: error || undefined }));
    },
    [validateField, values]
  );

  const validateAll = useCallback((): boolean => {
    if (!validationRules) return true;

    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(validationRules).forEach((key) => {
      const name = key as keyof T;
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(
      Object.keys(validationRules).reduce((acc, key) => {
        acc[key as keyof T] = true;
        return acc;
      }, {} as Partial<Record<keyof T, boolean>>)
    );

    return isValid;
  }, [validationRules, validateField, values]);

  const handleSubmit = useCallback(
    async (onSubmit: (values: T) => Promise<void> | void) => {
      if (!validateAll()) return;

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [validateAll, values]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const setFieldValue = useCallback((name: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid: Object.values(errors).every(error => !error), // Check if all error values are falsy
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue,
    setValues,
  };
}