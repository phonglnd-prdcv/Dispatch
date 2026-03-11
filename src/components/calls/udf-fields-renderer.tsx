import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';

import { getUdfDefinition, getUdfValues } from '@/api/userDefinedFields/userDefinedFields';
import { type UdfFieldResultData } from '@/models/v4/userDefinedFields/udfFieldResultData';
import { type UdfFieldValueInput } from '@/models/v4/userDefinedFields/udfFieldValueInput';
import { type UdfFieldValueResultData } from '@/models/v4/userDefinedFields/udfFieldValueResultData';

import { Text } from '../ui/text';

// FieldDataType enum
const UDF_FIELD_TYPE = {
  Text: 0,
  Number: 1,
  Decimal: 2,
  Boolean: 3,
  Date: 4,
  DateTime: 5,
  Dropdown: 6,
  MultiSelect: 7,
  Email: 8,
  Phone: 9,
  Url: 10,
} as const;

interface UdfFieldsRendererProps {
  entityType: number;
  entityId?: string;
  onValuesChange: (values: UdfFieldValueInput[]) => void;
  initialValues?: UdfFieldValueResultData[];
  isDark?: boolean;
  readOnly?: boolean;
}

export const UdfFieldsRenderer: React.FC<UdfFieldsRendererProps> = ({ entityType, entityId, onValuesChange, initialValues, isDark = false, readOnly = false }) => {
  const [fields, setFields] = useState<UdfFieldResultData[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasFields, setHasFields] = useState(false);

  const notifyChange = useCallback(
    (fieldList: UdfFieldResultData[], valueMap: Record<string, string>) => {
      const result: UdfFieldValueInput[] = fieldList.map((f) => ({
        UdfFieldId: f.UdfFieldId,
        Value: valueMap[f.UdfFieldId] ?? '',
      }));
      onValuesChange(result);
    },
    [onValuesChange]
  );

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const defResult = await getUdfDefinition(entityType);
        if (!isMounted) return;

        const fieldList = defResult?.Data?.Fields ?? [];
        const enabledFields = fieldList.filter((f) => f.IsEnabled && f.IsVisibleOnMobile);
        setFields(enabledFields);
        setHasFields(enabledFields.length > 0);

        // Build initial values map
        const initialMap: Record<string, string> = {};
        enabledFields.forEach((f) => {
          initialMap[f.UdfFieldId] = f.DefaultValue ?? '';
        });

        // If we have an entityId, fetch existing values
        if (entityId && entityId.trim() !== '') {
          try {
            const valResult = await getUdfValues(entityType, entityId);
            (valResult?.Data ?? []).forEach((v) => {
              initialMap[v.UdfFieldId] = v.Value ?? '';
            });
          } catch {
            // Silently fall back to defaults/initialValues
          }
        }

        // Apply any externally provided initial values
        if (initialValues) {
          initialValues.forEach((v) => {
            initialMap[v.UdfFieldId] = v.Value ?? '';
          });
        }

        if (isMounted) {
          setValues(initialMap);
          notifyChange(enabledFields, initialMap);
        }
      } catch {
        if (isMounted) setHasFields(false);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId, initialValues, notifyChange]);

  const handleValueChange = useCallback(
    (fieldId: string, newValue: string) => {
      setValues((prev) => {
        const updated = { ...prev, [fieldId]: newValue };
        notifyChange(fields, updated);
        return updated;
      });
    },
    [fields, notifyChange]
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={isDark ? '#9ca3af' : '#6b7280'} />
      </View>
    );
  }

  if (!hasFields) return null;

  const renderField = (field: UdfFieldResultData) => {
    const val = values[field.UdfFieldId] ?? '';
    const label = field.Label || field.Name;
    const placeholder = field.Placeholder || label;
    const isFieldReadOnly = readOnly || field.IsReadOnly;

    const inputStyle = StyleSheet.flatten([styles.input, isDark ? styles.inputDark : styles.inputLight, isFieldReadOnly ? styles.inputReadOnly : {}]);
    const labelStyle = StyleSheet.flatten([styles.label, isDark ? styles.labelDark : styles.labelLight]);
    const descStyle = StyleSheet.flatten([styles.description, isDark ? styles.descriptionDark : styles.descriptionLight]);

    switch (field.FieldDataType) {
      case UDF_FIELD_TYPE.Boolean:
        return (
          <View key={field.UdfFieldId} style={styles.fieldRow}>
            <View style={styles.booleanRow}>
              <Text style={labelStyle}>
                {label}
                {field.IsRequired ? <Text style={styles.required}> *</Text> : null}
              </Text>
              <BooleanToggle value={val === 'true'} onChange={(v) => handleValueChange(field.UdfFieldId, v ? 'true' : 'false')} disabled={isFieldReadOnly} isDark={isDark} />
            </View>
            {field.Description ? <Text style={descStyle}>{field.Description}</Text> : null}
          </View>
        );

      case UDF_FIELD_TYPE.Dropdown:
      case UDF_FIELD_TYPE.MultiSelect: {
        const opts = field.Options && field.Options.length > 0 ? field.Options : field.ValidationRules ? field.ValidationRules.split(',').map((o) => o.trim()) : [];
        return (
          <View key={field.UdfFieldId} style={styles.fieldRow}>
            <Text style={labelStyle}>
              {label}
              {field.IsRequired ? <Text style={styles.required}> *</Text> : null}
            </Text>
            {field.Description ? <Text style={descStyle}>{field.Description}</Text> : null}
            <OptionSelector
              options={opts}
              value={val}
              multiSelect={field.FieldDataType === UDF_FIELD_TYPE.MultiSelect}
              onChange={(v) => handleValueChange(field.UdfFieldId, v)}
              disabled={isFieldReadOnly}
              isDark={isDark}
              placeholder={placeholder}
            />
          </View>
        );
      }

      case UDF_FIELD_TYPE.Number:
      case UDF_FIELD_TYPE.Decimal:
        return (
          <View key={field.UdfFieldId} style={styles.fieldRow}>
            <Text style={labelStyle}>
              {label}
              {field.IsRequired ? <Text style={styles.required}> *</Text> : null}
            </Text>
            {field.Description ? <Text style={descStyle}>{field.Description}</Text> : null}
            <TextInput
              style={inputStyle}
              value={val}
              onChangeText={(v) => handleValueChange(field.UdfFieldId, v)}
              placeholder={placeholder}
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              keyboardType="numeric"
              editable={!isFieldReadOnly}
              accessibilityLabel={label}
            />
          </View>
        );

      case UDF_FIELD_TYPE.Email:
        return (
          <View key={field.UdfFieldId} style={styles.fieldRow}>
            <Text style={labelStyle}>
              {label}
              {field.IsRequired ? <Text style={styles.required}> *</Text> : null}
            </Text>
            {field.Description ? <Text style={descStyle}>{field.Description}</Text> : null}
            <TextInput
              style={inputStyle}
              value={val}
              onChangeText={(v) => handleValueChange(field.UdfFieldId, v)}
              placeholder={placeholder}
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isFieldReadOnly}
              accessibilityLabel={label}
            />
          </View>
        );

      case UDF_FIELD_TYPE.Phone:
        return (
          <View key={field.UdfFieldId} style={styles.fieldRow}>
            <Text style={labelStyle}>
              {label}
              {field.IsRequired ? <Text style={styles.required}> *</Text> : null}
            </Text>
            {field.Description ? <Text style={descStyle}>{field.Description}</Text> : null}
            <TextInput
              style={inputStyle}
              value={val}
              onChangeText={(v) => handleValueChange(field.UdfFieldId, v)}
              placeholder={placeholder}
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              keyboardType="phone-pad"
              editable={!isFieldReadOnly}
              accessibilityLabel={label}
            />
          </View>
        );

      case UDF_FIELD_TYPE.Url:
        return (
          <View key={field.UdfFieldId} style={styles.fieldRow}>
            <Text style={labelStyle}>
              {label}
              {field.IsRequired ? <Text style={styles.required}> *</Text> : null}
            </Text>
            {field.Description ? <Text style={descStyle}>{field.Description}</Text> : null}
            <TextInput
              style={inputStyle}
              value={val}
              onChangeText={(v) => handleValueChange(field.UdfFieldId, v)}
              placeholder={placeholder}
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              keyboardType="url"
              autoCapitalize="none"
              editable={!isFieldReadOnly}
              accessibilityLabel={label}
            />
          </View>
        );

      default:
        // Text, Date, DateTime — use plain text input
        return (
          <View key={field.UdfFieldId} style={styles.fieldRow}>
            <Text style={labelStyle}>
              {label}
              {field.IsRequired ? <Text style={styles.required}> *</Text> : null}
            </Text>
            {field.Description ? <Text style={descStyle}>{field.Description}</Text> : null}
            <TextInput
              style={inputStyle}
              value={val}
              onChangeText={(v) => handleValueChange(field.UdfFieldId, v)}
              placeholder={placeholder}
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              editable={!isFieldReadOnly}
              accessibilityLabel={label}
            />
          </View>
        );
    }
  };

  // Group fields by GroupName
  const grouped = fields.reduce<Record<string, UdfFieldResultData[]>>((acc, f) => {
    const key = f.GroupName || '';
    if (!acc[key]) acc[key] = [];
    acc[key].push(f);
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      {Object.entries(grouped).map(([group, groupFields]) => (
        <View key={group || '__default__'}>
          {group ? <Text style={StyleSheet.flatten([styles.groupLabel, isDark ? styles.groupLabelDark : styles.groupLabelLight])}>{group}</Text> : null}
          {groupFields.sort((a, b) => a.SortOrder - b.SortOrder).map(renderField)}
        </View>
      ))}
    </View>
  );
};

// --- Sub-components ---

interface BooleanToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  isDark?: boolean;
}

const BooleanToggle: React.FC<BooleanToggleProps> = ({ value, onChange, disabled = false, isDark = false }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.toggleRow}>
      <Text
        style={StyleSheet.flatten([styles.toggleOption, value ? (isDark ? styles.toggleActiveDark : styles.toggleActiveLight) : isDark ? styles.toggleInactiveDark : styles.toggleInactiveLight])}
        onPress={() => !disabled && onChange(true)}
        accessibilityRole="button"
        accessibilityLabel={t('common.yes', 'Yes')}
      >
        {t('common.yes', 'Yes')}
      </Text>
      <Text
        style={StyleSheet.flatten([styles.toggleOption, !value ? (isDark ? styles.toggleActiveDark : styles.toggleActiveLight) : isDark ? styles.toggleInactiveDark : styles.toggleInactiveLight])}
        onPress={() => !disabled && onChange(false)}
        accessibilityRole="button"
        accessibilityLabel={t('common.no', 'No')}
      >
        {t('common.no', 'No')}
      </Text>
    </View>
  );
};

interface OptionSelectorProps {
  options: string[];
  value: string;
  multiSelect: boolean;
  onChange: (v: string) => void;
  disabled?: boolean;
  isDark?: boolean;
  placeholder?: string;
}

const OptionSelector: React.FC<OptionSelectorProps> = ({ options, value, multiSelect, onChange, disabled = false, isDark = false }) => {
  const selectedValues = value ? value.split(',').map((v) => v.trim()) : [];

  const toggle = (opt: string) => {
    if (disabled) return;
    if (multiSelect) {
      const next = selectedValues.includes(opt) ? selectedValues.filter((v) => v !== opt) : [...selectedValues, opt];
      onChange(next.join(','));
    } else {
      onChange(selectedValues.includes(opt) ? '' : opt);
    }
  };

  return (
    <View style={styles.optionContainer}>
      {options.map((opt) => {
        const isSelected = selectedValues.includes(opt);
        return (
          <Text
            key={opt}
            style={StyleSheet.flatten([
              styles.optionItem,
              isDark ? styles.optionItemDark : styles.optionItemLight,
              isSelected ? (isDark ? styles.optionSelectedDark : styles.optionSelectedLight) : {},
              disabled ? styles.optionDisabled : {},
            ])}
            onPress={() => toggle(opt)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            {opt}
          </Text>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  loadingContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupLabelDark: {
    color: '#9ca3af',
  },
  groupLabelLight: {
    color: '#6b7280',
  },
  fieldRow: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  labelDark: {
    color: '#d1d5db',
  },
  labelLight: {
    color: '#374151',
  },
  description: {
    fontSize: 12,
    marginBottom: 6,
  },
  descriptionDark: {
    color: '#6b7280',
  },
  descriptionLight: {
    color: '#9ca3af',
  },
  required: {
    color: '#ef4444',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  inputDark: {
    backgroundColor: '#262626',
    borderColor: '#404040',
    color: '#ffffff',
  },
  inputLight: {
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
    color: '#111827',
  },
  inputReadOnly: {
    opacity: 0.6,
  },
  booleanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleRow: {
    flexDirection: 'row',
  },
  toggleOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  toggleActiveDark: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
    color: '#ffffff',
    borderRadius: 6,
  },
  toggleActiveLight: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
    color: '#ffffff',
    borderRadius: 6,
  },
  toggleInactiveDark: {
    backgroundColor: '#262626',
    borderColor: '#404040',
    color: '#9ca3af',
    borderRadius: 6,
  },
  toggleInactiveLight: {
    backgroundColor: '#f9fafb',
    borderColor: '#d1d5db',
    color: '#6b7280',
    borderRadius: 6,
  },
  optionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionItem: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
    fontSize: 14,
  },
  optionItemDark: {
    backgroundColor: '#262626',
    borderColor: '#404040',
    color: '#d1d5db',
  },
  optionItemLight: {
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
    color: '#374151',
  },
  optionSelectedDark: {
    backgroundColor: '#1d4ed8',
    borderColor: '#2563eb',
    color: '#ffffff',
  },
  optionSelectedLight: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
    color: '#1d4ed8',
  },
  optionDisabled: {
    opacity: 0.5,
  },
});
