import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../lib/colors';
import { typography, fontSizes } from '../../lib/typography';

interface PhaseProgressProps {
  phase1Complete: boolean;
  phase2Complete: boolean;
  currentTVS?: number | null;
  currentMSS?: number | null;
}

interface PhaseNodeProps {
  label: string;
  sublabel?: string;
  done: boolean;
  active: boolean;
}

function PhaseNode({ label, sublabel, done, active }: PhaseNodeProps) {
  return (
    <View style={styles.node}>
      <View
        style={[
          styles.circle,
          done && styles.circleDone,
          active && !done && styles.circleActive,
        ]}
      >
        <Text style={[styles.circleText, (done || active) && styles.circleTextActive]}>
          {done ? '\u2713' : label.charAt(0)}
        </Text>
      </View>
      <Text style={[styles.nodeLabel, done && styles.nodeLabelDone]}>{label}</Text>
      {sublabel && <Text style={styles.nodeSublabel}>{sublabel}</Text>}
    </View>
  );
}

function Connector({ done }: { done: boolean }) {
  return (
    <View style={[styles.connector, done && styles.connectorDone]} />
  );
}

export function PhaseProgress({ phase1Complete, phase2Complete, currentTVS, currentMSS }: PhaseProgressProps) {
  const phase1Active = !phase1Complete;
  const phase2Active = phase1Complete && !phase2Complete;
  const dossierActive = phase1Complete && phase2Complete;

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <PhaseNode
          label="Phase 1"
          sublabel={currentTVS != null ? `TVS ${currentTVS}` : undefined}
          done={phase1Complete}
          active={phase1Active}
        />
        <Connector done={phase1Complete} />
        <PhaseNode
          label="Phase 2"
          sublabel={currentMSS != null ? `MSS ${currentMSS}` : undefined}
          done={phase2Complete}
          active={phase2Active}
        />
        <Connector done={phase2Complete} />
        <PhaseNode
          label="Dossier"
          done={dossierActive}
          active={dossierActive}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  node: {
    alignItems: 'center',
    width: 72,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  circleDone: {
    backgroundColor: colors.electric,
  },
  circleActive: {
    backgroundColor: colors.electricLight,
    borderWidth: 2,
    borderColor: colors.electric,
  },
  circleText: {
    fontSize: fontSizes.sm,
    color: colors.muted,
    fontFamily: typography.subheading,
  },
  circleTextActive: {
    color: colors.white,
  },
  nodeLabel: {
    fontSize: fontSizes.xs,
    fontFamily: typography.subheading,
    color: colors.muted,
    textAlign: 'center',
  },
  nodeLabelDone: {
    color: colors.electric,
  },
  nodeSublabel: {
    fontSize: 10,
    fontFamily: typography.body,
    color: colors.muted,
    textAlign: 'center',
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginTop: 15,
    marginHorizontal: 4,
  },
  connectorDone: {
    backgroundColor: colors.electric,
  },
});
