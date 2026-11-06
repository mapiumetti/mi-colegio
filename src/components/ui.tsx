import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState, type ReactNode } from 'react';
import {
  Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, View,
  type StyleProp, type TextInputProps, type ViewStyle,
} from 'react-native';
import { colorNota, colors, radius, spacing } from '../lib/theme';

export function Screen({ children, scroll = true, onRefresh }: { children: ReactNode; scroll?: boolean; onRefresh?: () => void }) {
  if (!scroll) return <View style={[s.screen, { padding: spacing }]}>{children}</View>;
  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={{ padding: spacing, paddingBottom: 48, gap: 12 }}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={false} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} /> : undefined}
    >
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={s.title}>{children}</Text>;
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text style={s.muted}>{children}</Text>;
}

type BtnProps = { title: string; onPress: () => void; variant?: 'primary' | 'soft' | 'danger'; icon?: string; disabled?: boolean; style?: StyleProp<ViewStyle> };
export function Button({ title, onPress, variant = 'primary', icon, disabled, style }: BtnProps) {
  const bg = variant === 'primary' ? colors.primary : variant === 'danger' ? (colors.dark ? '#4A1D1F' : '#FDECEC') : colors.primarySoft;
  const fg = variant === 'primary' ? colors.onPrimary : variant === 'danger' ? colors.danger : colors.dark ? colors.text : colors.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [s.btn, { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 }, style]}
    >
      <Text style={[s.btnText, { color: fg }]}>{icon ? `${icon}  ` : ''}{title}</Text>
    </Pressable>
  );
}

export function Field({ label, ...props }: { label: string } & TextInputProps) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.muted} style={s.input} {...props} />
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }, style]}>{children}</View>;
}

export function Chips<T extends string | number>({ options, value, onChange, multi }: {
  options: { value: T; label: string; color?: string }[];
  value: T | T[];
  onChange: (v: T) => void;
  multi?: boolean;
}) {
  const activo = (v: T) => (multi ? (value as T[]).includes(v) : value === v);
  return (
    <Row>
      {options.map((o) => (
        <Pressable
          key={String(o.value)}
          onPress={() => onChange(o.value)}
          style={[s.chip, activo(o.value) && { backgroundColor: o.color ?? colors.primary, borderColor: o.color ?? colors.primary }]}
        >
          <Text style={{ color: activo(o.value) ? colors.onPrimary : colors.text, fontWeight: '600' }}>{o.label}</Text>
        </Pressable>
      ))}
    </Row>
  );
}

export function SwitchRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
      <Text style={{ color: colors.text, fontSize: 16, flex: 1 }}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary }} />
    </Row>
  );
}

/** Selector de fecha u hora que funciona igual en Android e iOS. */
export function DateField({ label, value, mode, onChange }: { label: string; value: Date; mode: 'date' | 'time' | 'datetime'; onChange: (d: Date) => void }) {
  const [iosOpen, setIosOpen] = useState(false);
  const [temp, setTemp] = useState(value);
  const texto =
    mode === 'time'
      ? value.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      : mode === 'date'
        ? value.toLocaleDateString('es-AR')
        : `${value.toLocaleDateString('es-AR')} ${value.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;

  const abrir = () => {
    if (Platform.OS === 'android') {
      const pedir = (m: 'date' | 'time', base: Date, next: (d: Date) => void) =>
        DateTimePickerAndroid.open({ value: base, mode: m, is24Hour: true, onValueChange: (_e, d) => next(d) });
      if (mode === 'datetime') {
        pedir('date', value, (d) => pedir('time', d, onChange));
      } else {
        pedir(mode, value, onChange);
      }
    } else {
      setTemp(value);
      setIosOpen(true);
    }
  };

  return (
    <View style={{ gap: 4 }}>
      <Text style={s.label}>{label}</Text>
      <Pressable onPress={abrir} style={s.input}>
        <Text style={{ color: colors.text, fontSize: 16 }}>{texto}</Text>
      </Pressable>
      {Platform.OS === 'ios' && (
        <Modal visible={iosOpen} transparent animationType="slide">
          <View style={s.modalBg}>
            <View style={s.modal}>
              <DateTimePicker value={temp} mode={mode} display="spinner" locale="es-AR" themeVariant={colors.dark ? 'dark' : 'light'} onValueChange={(_e, d) => setTemp(d)} />
              <Button title="Listo" onPress={() => { onChange(temp); setIosOpen(false); }} />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

export function ListItem({ title, subtitle, left, right, onPress, onLongPress }: {
  title: string; subtitle?: string; left?: ReactNode; right?: ReactNode; onPress?: () => void; onLongPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={({ pressed }) => [s.item, pressed && onPress && { opacity: 0.7 }]}>
      {left}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, color: colors.text, fontWeight: '600' }}>{title}</Text>
        {subtitle ? <Text style={s.muted}>{subtitle}</Text> : null}
      </View>
      {right}
    </Pressable>
  );
}

export const Dot = ({ color }: { color: string }) => <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color }} />;

function crearEstilos() {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  card: { backgroundColor: colors.card, borderRadius: radius, padding: spacing, gap: 10, borderWidth: 1, borderColor: colors.border },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted, fontSize: 14 },
  label: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  input: { backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: colors.text },
  btn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: '700' },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  modal: { backgroundColor: colors.card, padding: spacing, borderTopLeftRadius: 20, borderTopRightRadius: 20, gap: 12, paddingBottom: 32 },
  });
}

// Los estilos se recalculan cuando cambia el tema (claro/oscuro o colores).
let cache: { clave: string; estilos: ReturnType<typeof crearEstilos> } | null = null;
export const s = new Proxy({} as ReturnType<typeof crearEstilos>, {
  get(_t, k: string) {
    const clave = `${colors.dark}-${colors.primary}`;
    if (!cache || cache.clave !== clave) cache = { clave, estilos: crearEstilos() };
    return cache.estilos[k as keyof ReturnType<typeof crearEstilos>];
  },
});

/** Nota con color: 9–10 verde fuerte, 7–8,99 verde suave, 4–6,99 amarillo, menos de 4 rojo. */
export function NotaBadge({ nota, texto, grande }: { nota: number | null; texto?: string; grande?: boolean }) {
  const c = colorNota(nota);
  return (
    <View style={{ backgroundColor: c.bg, borderRadius: 10, paddingHorizontal: grande ? 14 : 10, paddingVertical: grande ? 8 : 4, minWidth: 44, alignItems: 'center' }}>
      <Text style={{ color: c.fg, fontWeight: '800', fontSize: grande ? 22 : 15 }}>{texto ?? (nota != null ? nota.toFixed(2).replace('.', ',') : '—')}</Text>
    </View>
  );
}
