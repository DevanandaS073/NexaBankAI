function StatusBadge({ status }) {
    const getStyles = (state) => {
        switch (state) {
            case "pending":
                return {
                    text: "Pending",
                    color: "#b45309",
                    bg: "rgba(245, 158, 11, 0.08)"
                }
            case "in_progress":
                return {
                    text: "In Progress",
                    color: "#1d4ed8",
                    bg: "rgba(59, 130, 246, 0.08)"
                }
            case "reassigned":
                return {
                    text: "Reassigned",
                    color: "#7c3aed",
                    bg: "rgba(124, 58, 237, 0.08)"
                }
            case "resolved":
                return {
                    text: "Resolved",
                    color: "#047857",
                    bg: "rgba(16, 185, 129, 0.08)"
                }
            default:
                return {
                    text: state || "Unknown",
                    color: "#475569",
                    bg: "rgba(148, 163, 184, 0.08)"
                }
        }
    }

    const config = getStyles(status)

    return (
        <span style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "4px 12px",
            borderRadius: "20px",
            fontSize: "10px",
            fontWeight: "700",
            color: config.color,
            backgroundColor: config.bg,
            border: `1px solid rgba(255, 255, 255, 0.65)`,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            backdropFilter: "blur(8px)"
        }}>
            {config.text}
        </span>
    )
}

export default StatusBadge
