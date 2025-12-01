Install motion library and react. 

The goal is to create a one time password input form where each input is a digit, and its entrance is animated (position from bottom to top, size from small to large, opacity from 0 to 1). When user enters a digit, the focus of the input moves to the next input.

Specifications:

- Highlighted outline moves from one box to another while entering digits
- When entered incorrectly:
- Box highlight change from blue to red
- Box highlight move from the end to the start
- All boxes shake
- Digit fade from bottom to top when enter
- When entered correctly:
- The icon circle bounce and change logo from the email icon to the lock icon


The OTP form has 6 inputs, and the user can enter a maximum of 6 digits.

The entire page consists of a flexbox container with the following structure (from top):

- A header with the title "One Time Password"
- A description
- The OTP form

Implement this as a React component under task2 folder that is runnable in browser.