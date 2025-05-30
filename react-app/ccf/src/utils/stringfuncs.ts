export const firstLetterCap = (str: string): string => {
    return str ? str[0].toUpperCase() + str.slice(1) : ""
}