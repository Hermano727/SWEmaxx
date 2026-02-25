/**
 * Question bank for interviews. At least one Easy / Medium / Hard (LeetCode / NeetCode Blind 75 style).
 * id is used to store in interview meta and map history to the problems page.
 */
export type Difficulty = "easy" | "medium" | "hard"

// Languages supported in the live interview editor.
export type EditorLanguage = "javascript" | "python" | "java" | "cpp"

export const SUPPORTED_EDITOR_LANGUAGES: EditorLanguage[] = ["python", "javascript", "java", "cpp"]
export const DEFAULT_EDITOR_LANGUAGE: EditorLanguage = "python"

export type QuestionBankItem = {
  id: string
  title: string
  difficulty: Difficulty
  description: string
  examples: { input: string; output: string; explanation?: string }[]
  constraints: string[]
  /** Up to three progressively stronger hints shown during the interview. */
  hints?: string[]
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
    hints: [
      "Start with the naive approach: check every pair of indices to see if they sum to the target. What is its time complexity?",
      "Can you trade extra space for time by remembering numbers you've already seen while scanning the array once?",
      "Use a hash map from value to index. As you iterate, for each nums[i] check if target - nums[i] is already in the map; if so, you have your pair.",
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
    hints: [
      "When you see an opening bracket, what do you expect to see later for the string to stay valid?",
      "Try scanning left to right and keeping track of the sequence of unmatched opening brackets.",
      "Use a stack: push opening brackets, and for each closing bracket, pop and verify that it matches. The stack must end empty for a valid string.",
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
    hints: [
      "Think about how you add two numbers on paper from right to left, keeping track of a carry.",
      "You can walk both lists at the same time, adding their current digits and a carry value. What happens when one list is shorter?",
      "Maintain a running carry and build a new list node by node. Continue while there is at least one node left or a non-zero carry.",
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
    hints: [
      "A brute-force approach would check every substring and test whether it has repeating characters. How expensive is that?",
      "Consider maintaining a current window of characters with no repeats as you move a right pointer through the string.",
      "Use a sliding window with last-seen indices: when you see a repeated character, move the left pointer past its previous index and update the maximum length.",
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
    hints: [
      "One obvious approach is to merge the two sorted arrays and then take the median. What time and space would that use?",
      "The median is defined by how many elements lie on each side. Can you think of this as choosing a partition point rather than explicitly merging?",
      "Binary search on the smaller array's partition index so that the combined left part has half the elements and all left elements are ≤ all right elements; then compute the median from the border values.",
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

/**
 * Default code templates per problem id, for each supported language.
 * These are intentionally lightweight "starter" templates – the editor does
 * not execute code yet, so the goal is to give candidates a familiar shell.
 */
const JS_CODE_TEMPLATES: Record<string, string> = {
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

const PYTHON_CODE_TEMPLATES: Record<string, string> = {
  "two-sum": `from typing import List

def two_sum(nums: List[int], target: int) -> List[int]:
    # Your code here
    pass
`,
  "valid-parentheses": `def is_valid(s: str) -> bool:
    # Your code here
    pass
`,
  "add-two-numbers": `class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None):
        self.val = val
        self.next = next


def add_two_numbers(l1: ListNode | None, l2: ListNode | None) -> ListNode | None:
    # Your code here
    pass
`,
  "longest-substring-without-repeating": `def length_of_longest_substring(s: str) -> int:
    # Your code here
    return 0
`,
  "median-of-two-sorted-arrays": `from typing import List

def find_median_sorted_arrays(nums1: List[int], nums2: List[int]) -> float:
    # Your code here
    return 0.0
`,
}

const JAVA_CODE_TEMPLATES: Record<string, string> = {
  "two-sum": `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your code here
        return new int[0];
    }
}
`,
}

const CPP_CODE_TEMPLATES: Record<string, string> = {
  "two-sum": `#include <vector>
using namespace std;

vector<int> twoSum(const vector<int>& nums, int target) {
    // Your code here
    return {};
}
`,
}

const DEFAULT_CODE_TEMPLATES: Record<EditorLanguage, string> = {
  javascript: `function solve(input) {
  // Your code here
}
`,
  python: `def solve():
    # Your code here
    pass
`,
  java: `class Solution {
    public void solve() {
        // Your code here
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Your code here
    return 0;
}
`,
}

/** Get a language-aware starter template for a given problem. */
export function getCodeTemplate(problemId: string, language: EditorLanguage = "javascript"): string {
  const byLanguage: Record<EditorLanguage, Record<string, string>> = {
    javascript: JS_CODE_TEMPLATES,
    python: PYTHON_CODE_TEMPLATES,
    java: JAVA_CODE_TEMPLATES,
    cpp: CPP_CODE_TEMPLATES,
  }

  const templates = byLanguage[language] ?? JS_CODE_TEMPLATES
  return templates[problemId] ?? DEFAULT_CODE_TEMPLATES[language] ?? DEFAULT_CODE_TEMPLATES.javascript
}
