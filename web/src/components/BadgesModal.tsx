import { useMemo } from "react";
import { X, Shield, Award, Crown, Flame, Sparkles, Lock, CheckCircle2, Medal } from "lucide-react";
import { Mass } from "../types/types";
import { theme } from "../theme/theme";
import { getMassPoints } from "../utils/ranking.utils";
import { formatRole, getUserGender } from "../constants/roles";
import { formatServoName } from "../utils/format.utils";

interface BadgesModalProps {
  masses: Mass[];
  userId: string;
  userName: string;
  onClose: () => void;
}

interface AchievementItem {
  id: string;
  emoji: string;
  title: string;
  description: string;
  current: number;
  target: number;
  unlocked: boolean;
}

export function BadgesModal({ masses, userId, userName, onClose }: BadgesModalProps) {
  const journey = useMemo(() => {
    const now = new Date();
    const mySignups: {
      date: Date;
      isPast: boolean;
      present: boolean;
      points: number;
      isSolemnity: boolean;
      isSubstitution: boolean;
      roleKey: string;
    }[] = [];

    for (const mass of masses || []) {
      if (mass.name?.includes("Ajuste de Pontos")) continue;
      const signup = mass.signups?.find((s) => s.userId === userId && (s as any).status !== "RESERVA");
      if (!signup) continue;

      const d = new Date(mass.date);
      const pts = mass.points !== undefined && mass.points !== null ? mass.points : getMassPoints(mass.date);
      const roleNorm = (signup.role || "Auxiliar")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      let baseRole = "auxiliar";
      if (roleNorm.includes("cerimonia")) baseRole = "cerimoniario";
      else if (roleNorm.includes("librifer")) baseRole = "librifero";
      else if (roleNorm.includes("turifer")) baseRole = "turiferario";
      else if (roleNorm.includes("navet")) baseRole = "naveteiro";
      else if (roleNorm.includes("leit")) baseRole = "leituras";

      mySignups.push({
        date: d,
        isPast: d < now,
        present: Boolean(signup.present),
        points: pts,
        isSolemnity: Boolean(mass.isSolemnity),
        isSubstitution: Boolean(signup.isSubstitution),
        roleKey: baseRole,
      });
    }

    mySignups.sort((a, b) => a.date.getTime() - b.date.getTime());

    let totalPresences = 0;
    let totalAbsences = 0;
    let totalScore = 0;
    let weekdayOrSpecialCount = 0;
    let solemnityCount = 0;
    let substitutionsCount = 0;
    let currentStreak = 0;
    let bestStreak = 0;
    const roleCounts: Record<string, number> = {};

    for (const item of mySignups) {
      if (item.present) {
        totalPresences += 1;
        totalScore += item.points;
        if (item.points >= 2) weekdayOrSpecialCount += 1;
        if (item.isSolemnity) solemnityCount += 1;
        if (item.isSubstitution) substitutionsCount += 1;
        roleCounts[item.roleKey] = (roleCounts[item.roleKey] || 0) + 1;

        currentStreak += 1;
        if (currentStreak > bestStreak) bestStreak = currentStreak;
      } else if (item.isPast) {
        totalAbsences += 1;
        currentStreak = 0;
      }
    }

    const realized = totalPresences + totalAbsences;
    const attendancePct = realized > 0 ? Math.round((totalPresences / realized) * 100) : 100;
    const distinctRolesCount = Object.keys(roleCounts).length;

    // Níveis evolutivos (nunca travam!)
    const tiers = [
      { min: 0, next: 5, name: "Iniciante do Altar", badge: "🌱" },
      { min: 5, next: 15, name: "Servo(a) Dedicado(a)", badge: "🕯️" },
      { min: 15, next: 30, name: "Servo(a) Fiel", badge: "🛡️" },
      { min: 30, next: 50, name: "Coluna do Santuário", badge: "⭐" },
      { min: 50, next: 100, name: "Guardião(ã) do Altar", badge: "👑" },
    ];

    let levelTitle = "Lenda de Santa Terezinha";
    let levelEmoji = "🏆";
    let prevGoal = 100;
    let nextGoal = Math.ceil((totalPresences + 1) / 50) * 50;

    for (const t of tiers) {
      if (totalPresences < t.next) {
        levelTitle = t.name;
        levelEmoji = t.badge;
        prevGoal = t.min;
        nextGoal = t.next;
        break;
      }
    }

    const levelSpan = Math.max(1, nextGoal - prevGoal);
    const levelProgress = Math.min(100, Math.round(((totalPresences - prevGoal) / levelSpan) * 100));

    const gender = getUserGender(userId, userName);
    const topRoleEntry = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])[0];
    const favoriteRoleLabel = topRoleEntry
      ? formatRole(
          topRoleEntry[0] === "cerimoniario"
            ? "Cerimoniária"
            : topRoleEntry[0] === "librifero"
              ? "Librífera"
              : topRoleEntry[0] === "turiferario"
                ? "Turiferário"
                : topRoleEntry[0] === "naveteiro"
                  ? "Naveteiro"
                  : "Auxiliar",
          gender
        )
      : "—";

    const achievements: AchievementItem[] = [
      {
        id: "first-mass",
        emoji: "🕊️",
        title: "Primeiros Passos",
        description: "Serviu pela 1ª vez no Altar do Senhor",
        current: Math.min(totalPresences, 1),
        target: 1,
        unlocked: totalPresences >= 1,
      },
      {
        id: "streak-5",
        emoji: "🔥",
        title: "Chama Fiel",
        description: "5 escalas seguidas com presença sem faltar",
        current: Math.min(bestStreak, 5),
        target: 5,
        unlocked: bestStreak >= 5,
      },
      {
        id: "weekday-5",
        emoji: "⛪",
        title: "Sentinela da Semana",
        description: "Serviu em 5 missas de 2+ pontos (semana/especiais)",
        current: Math.min(weekdayOrSpecialCount, 5),
        target: 5,
        unlocked: weekdayOrSpecialCount >= 5,
      },
      {
        id: "subst-2",
        emoji: "🤝",
        title: "Coração Prestativo",
        description: "Socorreu colegas assumindo 2 substituições",
        current: Math.min(substitutionsCount, 2),
        target: 2,
        unlocked: substitutionsCount >= 2,
      },
      {
        id: "roles-4",
        emoji: "📖",
        title: "Polivalente do Altar",
        description: "Exerceu pelo menos 4 funções litúrgicas diferentes",
        current: Math.min(distinctRolesCount, 4),
        target: 4,
        unlocked: distinctRolesCount >= 4,
      },
      {
        id: "solemn-3",
        emoji: "✨",
        title: "Festa Solene",
        description: "Serviu em 3 Solenidades no Santuário",
        current: Math.min(solemnityCount, 3),
        target: 3,
        unlocked: solemnityCount >= 3,
      },
      {
        id: "streak-12",
        emoji: "💎",
        title: "Compromisso de Ouro",
        description: "12 escalas seguidas sem nenhuma falta",
        current: Math.min(bestStreak, 12),
        target: 12,
        unlocked: bestStreak >= 12,
      },
      {
        id: "veteran-25",
        emoji: "👑",
        title: "Guardião(ã) Fiel",
        description: "Completou 25 missas servidas com presença",
        current: Math.min(totalPresences, 25),
        target: 25,
        unlocked: totalPresences >= 25,
      },
    ];

    const unlockedCount = achievements.filter((a) => a.unlocked).length;

    return {
      totalPresences,
      totalScore,
      attendancePct,
      currentStreak,
      favoriteRoleLabel,
      levelTitle,
      levelEmoji,
      nextGoal,
      levelProgress,
      achievements,
      unlockedCount,
    };
  }, [masses, userId, userName]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.68)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "14px",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FAF8F5",
          width: "100%",
          maxWidth: "460px",
          maxHeight: "88vh",
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          borderRadius: "20px",
          boxSizing: "border-box",
          boxShadow: "0 20px 50px rgba(0,0,0,0.38)",
          border: `1.5px solid ${theme.colors.border}`,
        }}
      >
        {/* HEADER STICKY */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: theme.colors.primaryGradient,
            color: "#FFFFFF",
            padding: "16px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                background: "rgba(255,255,255,0.18)",
                padding: "8px",
                borderRadius: "10px",
                display: "flex",
              }}
            >
              <Medal size={20} color="#E6C786" />
            </div>
            <div>
              <div style={{ fontSize: "1.02rem", fontWeight: 800, color: "#FFFFFF", lineHeight: 1.2 }}>
                Minha Jornada & Medalhas
              </div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.86)" }}>
                {formatServoName(userName, userId)} • {journey.unlockedCount}/{journey.achievements.length} medalhas desbloqueadas
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              borderRadius: "50%",
              width: 30,
              height: 30,
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* BODY */}
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px", boxSizing: "border-box" }}>
          {/* CARD DE NÍVEL ATUAL */}
          <div
            style={{
              background: "linear-gradient(135deg, #FFFBF0 0%, #FDF2D6 100%)",
              border: "1.5px solid #E6C77E",
              borderRadius: "16px",
              padding: "16px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "2rem", lineHeight: 1, marginBottom: "6px" }}>{journey.levelEmoji}</div>
            <div style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8C6530" }}>
              Nível Atual no Altar
            </div>
            <div style={{ fontSize: "1.18rem", fontWeight: 900, color: "#4A3222", marginTop: "2px" }}>
              {journey.levelTitle}
            </div>
            <div style={{ fontSize: "0.78rem", color: "#785A3C", marginTop: "4px", marginBottom: "10px" }}>
              Função mais servida: <strong>{journey.favoriteRoleLabel}</strong> ({journey.totalScore} pts acumulados)
            </div>

            <div
              style={{
                background: "rgba(74, 50, 34, 0.1)",
                height: "10px",
                borderRadius: "999px",
                overflow: "hidden",
                marginBottom: "6px",
              }}
            >
              <div
                style={{
                  width: `${journey.levelProgress}%`,
                  background: "linear-gradient(90deg, #B8925A 0%, #4A3222 100%)",
                  height: "100%",
                  borderRadius: "999px",
                  transition: "width 0.5s ease",
                }}
              />
            </div>
            <div style={{ fontSize: "0.74rem", color: "#785A3C", fontWeight: 700 }}>
              {journey.totalPresences} / {journey.nextGoal} missas servidas para o próximo nível
            </div>
          </div>

          {/* 3 ESTATÍSTICAS PESSOAIS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E5DEC9",
                borderRadius: "12px",
                padding: "10px 6px",
                textAlign: "center",
              }}
            >
              <Shield size={16} color="#4A3222" style={{ marginBottom: "2px" }} />
              <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#4A3222" }}>{journey.totalPresences}</div>
              <div style={{ fontSize: "0.68rem", color: "#785A3C", fontWeight: 700 }}>Missas</div>
            </div>

            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E5DEC9",
                borderRadius: "12px",
                padding: "10px 6px",
                textAlign: "center",
              }}
            >
              <Award size={16} color="#166534" style={{ marginBottom: "2px" }} />
              <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#166534" }}>{journey.attendancePct}%</div>
              <div style={{ fontSize: "0.68rem", color: "#785A3C", fontWeight: 700 }}>Presença</div>
            </div>

            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E5DEC9",
                borderRadius: "12px",
                padding: "10px 6px",
                textAlign: "center",
              }}
            >
              <Flame size={16} color="#D97706" style={{ marginBottom: "2px" }} />
              <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#B45309" }}>{journey.currentStreak}</div>
              <div style={{ fontSize: "0.68rem", color: "#785A3C", fontWeight: 700 }}>Seguidas</div>
            </div>
          </div>

          {/* ÁLBUM DE MEDALHAS */}
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#785A3C",
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Crown size={14} color="#B45309" />
              <span>Álbum de Medalhas Litúrgicas</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {journey.achievements.map((ach) => (
                <div
                  key={ach.id}
                  style={{
                    background: ach.unlocked
                      ? "linear-gradient(145deg, #FFFFFF 0%, #FFFBEB 100%)"
                      : "#F3F1EC",
                    border: ach.unlocked ? "1.5px solid #D4A44C" : "1px dashed #D6CFC2",
                    borderRadius: "12px",
                    padding: "11px 10px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "6px",
                    opacity: ach.unlocked ? 1 : 0.72,
                    boxShadow: ach.unlocked ? "0 3px 10px rgba(184, 146, 90, 0.14)" : "none",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      style={{
                        fontSize: "1.35rem",
                        filter: ach.unlocked ? "none" : "grayscale(1)",
                      }}
                    >
                      {ach.emoji}
                    </span>
                    {ach.unlocked ? (
                      <span
                        style={{
                          fontSize: "0.64rem",
                          fontWeight: 800,
                          color: "#166534",
                          background: "#DCFCE7",
                          padding: "2px 6px",
                          borderRadius: "999px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <CheckCircle2 size={10} /> Conquistada
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: "0.65rem",
                          fontWeight: 800,
                          color: "#78716C",
                          background: "#E7E5E4",
                          padding: "2px 6px",
                          borderRadius: "999px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <Lock size={10} /> {ach.current}/{ach.target}
                      </span>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 800, color: ach.unlocked ? "#4A3222" : "#57534E", lineHeight: 1.2 }}>
                      {ach.title}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#78716C", lineHeight: 1.3, marginTop: "3px" }}>
                      {ach.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: theme.colors.primaryGradient,
              color: "white",
              border: "none",
              padding: "12px 20px",
              borderRadius: "10px",
              fontWeight: 800,
              fontSize: "0.88rem",
              width: "100%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <Sparkles size={15} />
            <span>Continuar Servindo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
