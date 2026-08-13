export const firstLetterCap = (str: string): string => {
    return str ? str[0].toUpperCase() + str.slice(1) : ""
}

export const formatGrantType = (grantType: string): string => {
    if (!grantType) return ""
    if (grantType.toLowerCase() === "nextgen") return "NextGen"
    if (grantType.toLowerCase() === "nonresearch") return "Non-Research"
    return firstLetterCap(grantType)
}