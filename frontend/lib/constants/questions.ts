/**
 * Question bank for interviews. At least one Easy / Medium / Hard (LeetCode / NeetCode Blind 75 style).
 * id is used to store in interview meta and map history to the problems page.
 */
export type Difficulty = "easy" | "medium" | "hard"

export type QuestionBankItem = {
  id: string
  title: string
  difficulty: Difficulty
  description: string
  examples: { input: string; output: string; explanation?: string }[]
  constraints: string[]
}

export const QUESTION_BANK: QuestionBankItem[] = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "easy",
    description:
      "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "nums[0] + nums[1] = 2 + 7 = 9",
      },
    ],
    constraints: [
      "2 ≤ nums.length ≤ 10⁴",
      "-10⁹ ≤ nums[i] ≤ 10⁹",
      "Only one valid answer exists.",
    ],
  },
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "easy",
    description:
      "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if open brackets are closed by the same type of brackets and in the correct order.",
    examples: [
      { input: "s = \"()\"", output: "true" },
      { input: "s = \"()[]{}\"", output: "true" },
      { input: "s = \"(]\"", output: "false" },
    ],
    constraints: [
      "1 ≤ s.length ≤ 10⁴",
      "s consists of parentheses only '()[]{}'.",
    ],
  },
  {
    id: "add-two-numbers",
    title: "Add Two Numbers",
    difficulty: "medium",
    description:
      "You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.",
    examples: [
      {
        input: "l1 = [2,4,3], l2 = [5,6,4]",
        output: "[7,0,8]",
        explanation: "342 + 465 = 807",
      },
    ],
    constraints: [
      "The number of nodes in each linked list is in the range [1, 100].",
      "0 ≤ Node.val ≤ 9",
      "It is guaranteed that the list represents a number that does not have leading zeros.",
    ],
  },
  {
    id: "longest-substring-without-repeating",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "medium",
    description:
      "Given a string s, find the length of the longest substring without repeating characters.",
    examples: [
      { input: "s = \"abcabcbb\"", output: "3", explanation: "The answer is \"abc\", with length 3." },
      { input: "s = \"bbbbb\"", output: "1", explanation: "The answer is \"b\", with length 1." },
    ],
    constraints: [
      "0 ≤ s.length ≤ 5 * 10⁴",
      "s consists of English letters, digits, symbols and spaces.",
    ],
  },
  {
    id: "median-of-two-sorted-arrays",
    title: "Median of Two Sorted Arrays",
    difficulty: "hard",
    description:
      "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays. The overall run time complexity should be O(log (m+n)).",
    examples: [
      { input: "nums1 = [1,3], nums2 = [2]", output: "2.00000", explanation: "merged array = [1,2,3] and median is 2." },
      { input: "nums1 = [1,2], nums2 = [3,4]", output: "2.50000", explanation: "merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5." },
    ],
    constraints: [
      "nums1.length == m",
      "nums2.length == n",
      "0 ≤ m ≤ 1000, 0 ≤ n ≤ 1000",
      "1 ≤ m + n ≤ 2000",
    ],
  },
]

export function getQuestionsByDifficulty(difficulty: Difficulty): QuestionBankItem[] {
  return QUESTION_BANK.filter((q) => q.difficulty === difficulty)
}

export function getQuestionById(id: string): QuestionBankItem | undefined {
  return QUESTION_BANK.find((q) => q.id === id)
}

/** Pick a random question from the bank, optionally filtered by difficulty. */
export function pickRandomQuestion(difficulty: "random" | Difficulty): QuestionBankItem {
  const pool =
    difficulty === "random"
      ? QUESTION_BANK
      : QUESTION_BANK.filter((q) => q.difficulty === difficulty)
  return pool[Math.floor(Math.random() * pool.length)]
}

/** Capitalize for display (e.g. "easy" -> "Easy"). */
export function capitalizeDifficulty(d: string): string {
  if (!d) return ""
  return d.charAt(0).toUpperCase() + d.slice(1).toLowerCase()
}

/** Default code template per problem id (JavaScript). Used for Reset and initial state. */
export const CODE_TEMPLATES: Record<string, string> = {
  "two-sum": `function twoSum(nums, target) {
  // Your code here
}`,
  "valid-parentheses": `function isValid(s) {
  // Your code here
}`,
  "add-two-numbers": `function addTwoNumbers(l1, l2) {
  // Your code here
}`,
  "longest-substring-without-repeating": `function lengthOfLongestSubstring(s) {
  // Your code here
}`,
  "median-of-two-sorted-arrays": `function findMedianSortedArrays(nums1, nums2) {
  // Your code here
}`,
}
const DEFAULT_CODE_TEMPLATE = `function solve(input) {
  // Your code here
}`
export function getCodeTemplate(problemId: string): string {
  return CODE_TEMPLATES[problemId] ?? DEFAULT_CODE_TEMPLATE
}
