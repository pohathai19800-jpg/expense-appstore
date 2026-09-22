import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type NumericKeypadProps = {
  onDigit: (digit: string) => void;
  onDecimal: () => void;
  onBackspace: () => void;
};

const ROWS: string[][] = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
];

export function NumericKeypad({
  onDigit,
  onDecimal,
  onBackspace,
}: NumericKeypadProps) {
  return (
    <View style={{ gap: 8 }}>
      {ROWS.map((row, rowIndex) => (
        <View key={rowIndex} style={{ flexDirection: 'row', gap: 8 }}>
          {row.map((digit) => (
            <KeyButton key={digit} onPress={() => onDigit(digit)}>
              <Text style={keyTextStyle}>{digit}</Text>
            </KeyButton>
          ))}
        </View>
      ))}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <KeyButton onPress={onDecimal}>
          <Text style={keyTextStyle}>.</Text>
        </KeyButton>

        <KeyButton onPress={() => onDigit('0')}>
          <Text style={keyTextStyle}>0</Text>
        </KeyButton>

        <KeyButton onPress={onBackspace} muted>
          <Ionicons name="backspace-outline" size={22} color="#374151" />
        </KeyButton>
      </View>
    </View>
  );
}

const keyTextStyle = {
  fontSize: 22,
  fontWeight: '600' as const,
  color: '#111827',
};

function KeyButton({
  onPress,
  children,
  muted,
}: {
  onPress: () => void;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? '#F3F4F6' : muted ? '#F9FAFB' : '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F3F4F6',
      })}
    >
      {children}
    </Pressable>
  );
}
