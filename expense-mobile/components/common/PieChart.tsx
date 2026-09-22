import type { ComponentProps } from 'react';
import { Text, View } from 'react-native';
import { Circle, Path, Svg } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type PieSlice = {
  key: string;
  value: number;
  color: string;
  icon?: IconName | null;
};

type PieChartProps = {
  data: PieSlice[];
  size?: number;
  minPercentToShowLabel?: number;
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeSlice(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

export function PieChart({ data, size = 200, minPercentToShowLabel = 5 }: PieChartProps) {
  const radius = size / 2;
  const cx = radius;
  const cy = radius;
  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  if (total <= 0) {
    return (
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={cx} cy={cy} r={radius} fill="#F3F4F6" />
      </Svg>
    );
  }

  type SlicePosition = { slice: PieSlice; startAngle: number; endAngle: number };

  const slices: SlicePosition[] = [];
  let cursor = 0;
  for (const slice of data) {
    const fraction = slice.value / total;
    const startAngle = cursor;
    const endAngle = startAngle + fraction * 360;
    slices.push({ slice, startAngle, endAngle });
    cursor = endAngle;
  }

  const labeledSlices = slices
    .map(({ slice, startAngle, endAngle }) => {
      const angleSpan = endAngle - startAngle;
      const percent = (angleSpan / 360) * 100;
      const midAngle = startAngle + angleSpan / 2;
      const labelPos = polarToCartesian(cx, cy, radius * 0.62, midAngle);

      return { slice, percent, labelPos };
    })
    .filter((item) => item.percent >= minPercentToShowLabel);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map(({ slice, startAngle, endAngle }) => (
          <Path
            key={slice.key}
            d={describeSlice(cx, cy, radius, startAngle, endAngle)}
            fill={slice.color}
          />
        ))}
      </Svg>

      {labeledSlices.map(({ slice, percent, labelPos }) => (
        <View
          key={`label-${slice.key}`}
          style={{
            position: 'absolute',
            left: labelPos.x - 26,
            top: labelPos.y - 10,
            width: 52,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
          }}
        >
          {slice.icon ? <Ionicons name={slice.icon} size={12} color="#FFFFFF" /> : null}
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
            {percent.toFixed(0)}%
          </Text>
        </View>
      ))}
    </View>
  );
}