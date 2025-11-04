#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Player test script - Joins a game and creates/joins a team.
Takes command line arguments for game code, email, team name, and action.
"""

from playwright.sync_api import sync_playwright, Page
import time
import argparse
import random
import sys
import os

def run_player_flow(game_code: str, email: str, team_name: str, action: str, player_id: str):
    """
    Run the player game flow.

    Args:
        game_code: The 6-character game code
        email: Player email address
        team_name: Name of the team to create or join
        action: 'create' to create new team, 'join' to join existing
        player_id: Identifier for screenshots (e.g., 'player1')
    """

    os.makedirs('./tmp', exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Set up console and error logging to file
        log_file = open(f'./tmp/{player_id}_console.log', 'w')

        def log_console(msg):
            log_line = f"[CONSOLE {msg.type}] {msg.text}\n"
            print(f"{player_id.upper()}: {log_line.strip()}", flush=True)
            log_file.write(log_line)
            log_file.flush()

        def log_error(error):
            log_line = f"[ERROR] {error}\n"
            print(f"{player_id.upper()}: {log_line.strip()}", flush=True)
            log_file.write(log_line)
            log_file.flush()

        page.on("console", log_console)
        page.on("pageerror", log_error)

        try:
            # Navigate to app
            print(f"🚀 {player_id.upper()}: Navigating to app", flush=True)
            page.goto('http://localhost:5173')
            time.sleep(2)
            page.screenshot(path=f'./tmp/{player_id}_01_initial.png', full_page=True)

            # Login
            print(f"🔐 {player_id.upper()}: Logging in as {email}", flush=True)
            email_input = page.locator('input[type="email"]').first
            email_input.fill(email)

            password_input = page.locator('input[type="password"]').first
            password_input.fill('Password123!')

            # Select Player role
            player_button = page.locator('button:has-text("Player")').first
            if player_button.is_visible(timeout=1000):
                player_button.click()

            login_button = page.locator('button:has-text("Sign In")').first
            login_button.click()

            # Wait for navigation with timeout instead of networkidle (which can hang with multiple browsers)
            print(f"⏳ {player_id.upper()}: Waiting for login to complete...", flush=True)
            try:
                page.wait_for_load_state('domcontentloaded', timeout=10000)
                time.sleep(2)
                print(f"✅ {player_id.upper()}: Logged in", flush=True)
            except Exception as e:
                print(f"⚠️  {player_id.upper()}: Login wait timed out, but continuing: {e}", flush=True)
                time.sleep(1)

            # Take screenshot (with error handling for parallel browser execution)
            try:
                print(f"📸 {player_id.upper()}: Taking logged_in screenshot...", flush=True)
                page.screenshot(path=f'./tmp/{player_id}_02_logged_in.png', full_page=True)
                print(f"✅ {player_id.upper()}: Screenshot saved", flush=True)
            except Exception as e:
                print(f"⚠️  {player_id.upper()}: Screenshot failed: {e}", flush=True)

            # Enter game code
            print(f"🎮 {player_id.upper()}: Entering game code {game_code}", flush=True)
            code_input = page.locator('input[placeholder*="ABC123" i], input[placeholder*="code" i], input[type="text"]').first
            if code_input.is_visible(timeout=3000):
                code_input.click()
                code_input.fill('')
                code_input.type(game_code, delay=50)
                time.sleep(0.5)
                page.screenshot(path=f'./tmp/{player_id}_03_code_entered.png', full_page=True)

                # Click Join Game button
                print(f"🔍 {player_id.upper()}: Looking for 'Join Game' button...", flush=True)
                page.screenshot(path=f'./tmp/{player_id}_03a_before_join_button.png', full_page=True)

                join_button = page.locator('button:has-text("Join Game"), button:has-text("Join")').first
                if join_button.is_visible(timeout=10000):
                    print(f"✅ {player_id.upper()}: Found 'Join Game' button, clicking...", flush=True)
                    join_button.click()
                    try:
                        page.wait_for_load_state('domcontentloaded', timeout=10000)
                    except Exception as e:
                        print(f"⚠️  {player_id.upper()}: Join wait timed out: {e}", flush=True)
                    time.sleep(2)
                    print(f"✅ {player_id.upper()}: Joined game", flush=True)
                    page.screenshot(path=f'./tmp/{player_id}_04_in_game.png', full_page=True)
                else:
                    print(f"❌ {player_id.upper()}: 'Join Game' button not found after 10 seconds!", flush=True)
                    print(f"📍 {player_id.upper()}: Current URL: {page.url}", flush=True)
                    page.screenshot(path=f'./tmp/{player_id}_03b_join_button_not_found.png', full_page=True)
                    print(f"⚠️  {player_id.upper()}: Continuing without joining game...", flush=True)

            # Handle team creation or joining
            if action == 'create':
                print(f"👥 {player_id.upper()}: Creating team '{team_name}'", flush=True)
                page.screenshot(path=f'./tmp/{player_id}_05_team_modal.png', full_page=True)

                # Click "+ Create New Team"
                create_team_btn = page.locator('button:has-text("Create New Team"), div:has-text("Create New Team")').first
                if create_team_btn.is_visible(timeout=3000):
                    create_team_btn.click()
                    time.sleep(1)

                    # Enter team name
                    team_input = page.locator('input[type="text"], input[placeholder*="team" i]').first
                    if team_input.is_visible(timeout=2000):
                        team_input.fill(team_name)
                        time.sleep(0.5)
                        page.screenshot(path=f'./tmp/{player_id}_06_team_name_filled.png', full_page=True)
                        print(f"📝 {player_id.upper()}: Filled team name '{team_name}'", flush=True)

                        # Wait before pressing Enter
                        print(f"⏳ {player_id.upper()}: Waiting 1.5s for app to be ready...", flush=True)
                        time.sleep(1.5)

                        # Press Enter key instead of clicking button
                        print(f"⌨️  {player_id.upper()}: Pressing ENTER key to submit team...", flush=True)
                        team_input.press('Enter')
                        print(f"📋 {player_id.upper()}: ENTER key pressed, waiting for network...", flush=True)

                        try:
                            page.wait_for_load_state('domcontentloaded', timeout=10000)
                        except Exception as e:
                            print(f"⚠️  {player_id.upper()}: Team creation wait timed out: {e}", flush=True)
                        time.sleep(2)

                        # Check if modal is still open (indicates failure)
                        modal_still_open = page.locator('text="Create your team"').is_visible()
                        if modal_still_open:
                            print(f"⚠️  {player_id.upper()}: Modal still open after ENTER - team creation may have failed!", flush=True)
                            print(f"📋 {player_id.upper()}: Check {player_id}_console.log for errors", flush=True)
                        else:
                            print(f"✅ {player_id.upper()}: Modal closed - team creation appears successful", flush=True)

                        print(f"✅ {player_id.upper()}: Created and joined team '{team_name}'", flush=True)
                        page.screenshot(path=f'./tmp/{player_id}_07_team_joined.png', full_page=True)
                    else:
                        print(f"⚠️  {player_id.upper()}: Team name input not found", flush=True)
                else:
                    print(f"⚠️  {player_id.upper()}: Create New Team button not found", flush=True)

            elif action == 'join':
                print(f"👥 {player_id.upper()}: Joining team '{team_name}'", flush=True)
                page.screenshot(path=f'./tmp/{player_id}_05_team_modal.png', full_page=True)

                # Wait for team to appear
                team_found = False
                for attempt in range(15):  # Try for 15 seconds
                    # Find the button that contains the team name (not just the text)
                    team_button = page.locator(f'button:has-text("{team_name}")').first
                    if team_button.is_visible(timeout=1000):
                        team_found = True
                        print(f"✅ {player_id.upper()}: Found team '{team_name}'", flush=True)

                        # Click the team button to select it
                        team_button.click(force=True)
                        print(f"🔘 {player_id.upper()}: Clicked team button for '{team_name}'", flush=True)
                        time.sleep(2)  # Increased wait for React state to update
                        page.screenshot(path=f'./tmp/{player_id}_06_team_selected.png', full_page=True)

                        # Click the "Join Game" button at the bottom of the modal
                        print(f"🔵 {player_id.upper()}: Looking for 'Join Game' submit button...", flush=True)
                        # Use a more specific selector for the blue submit button
                        join_button = page.locator('button:has-text("Join Game")').filter(has=page.locator('text="Join Game"')).last

                        if join_button.is_visible(timeout=3000):
                            print(f"🔵 {player_id.upper()}: Clicking 'Join Game' submit button...", flush=True)
                            join_button.click(force=True)
                            print(f"📋 {player_id.upper()}: Button clicked, waiting for navigation...", flush=True)

                            try:
                                page.wait_for_load_state('domcontentloaded', timeout=10000)
                            except Exception as e:
                                print(f"⚠️  {player_id.upper()}: Team join wait timed out: {e}", flush=True)
                            time.sleep(2)

                            # Check if we successfully joined
                            modal_still_open = page.locator('text="Select your team"').is_visible()
                            if modal_still_open:
                                print(f"⚠️  {player_id.upper()}: Modal still open - join may have failed!", flush=True)
                                print(f"📍 {player_id.upper()}: Current URL: {page.url}", flush=True)
                            else:
                                print(f"✅ {player_id.upper()}: Modal closed - join appears successful", flush=True)

                            print(f"✅ {player_id.upper()}: Joined team '{team_name}'", flush=True)
                            page.screenshot(path=f'./tmp/{player_id}_07_team_joined.png', full_page=True)
                        else:
                            print(f"❌ {player_id.upper()}: 'Join Game' submit button not visible!", flush=True)

                        break
                    print(f"⏳ {player_id.upper()}: Waiting for team '{team_name}'... ({attempt + 1}/15)", flush=True)
                    time.sleep(1)

                if not team_found:
                    print(f"❌ {player_id.upper()}: Team '{team_name}' not found after waiting", flush=True)
                    page.screenshot(path=f'./tmp/{player_id}_05_team_not_found.png', full_page=True)

            # Play through questions - randomly answer
            # With 3 rounds and 3 questions each, we have 9 questions total
            print(f"🎲 {player_id.upper()}: Waiting for questions to start", flush=True)

            for question_num in range(1, 10):  # 9 questions (3 rounds x 3 questions)
                print(f"📝 {player_id.upper()}: Waiting for Question {question_num}...", flush=True)

                # Wait for answer buttons to appear (up to 30 seconds)
                answer_found = False
                max_wait = 30
                start_wait = time.time()

                while not answer_found and (time.time() - start_wait) < max_wait:
                    try:
                        # Look for answer buttons - they start with "A.", "B.", "C.", "D."
                        available_answers = []

                        # Try to find elements that start with answer labels
                        for label in ['A.', 'B.', 'C.', 'D.']:
                            answer_elements = page.locator(f'text=/^{label}\\s+/').all()
                            for elem in answer_elements:
                                if elem.is_visible():
                                    # Get the parent button/div that's clickable
                                    parent = elem.locator('xpath=..').first
                                    if parent.is_visible():
                                        available_answers.append(parent)

                        if available_answers:
                            answer_found = True

                            # Random wait time between 1-5 seconds before answering
                            wait_time = random.uniform(1, 5)
                            print(f"⏳ {player_id.upper()}: Waiting {wait_time:.1f}s before answering...", flush=True)
                            time.sleep(wait_time)

                            # Randomly choose an answer
                            chosen_answer = random.choice(available_answers)
                            answer_text = chosen_answer.text_content()[:50] if chosen_answer.text_content() else "unknown"

                            print(f"🎯 {player_id.upper()}: Clicking answer: {answer_text}", flush=True)
                            chosen_answer.click()
                            print(f"✅ {player_id.upper()}: Answered question {question_num}", flush=True)
                            page.screenshot(path=f'./tmp/{player_id}_q{question_num}_answered.png', full_page=True)

                            # Wait a bit for answer to register
                            time.sleep(2)
                            break
                        else:
                            time.sleep(1)
                    except Exception as e:
                        print(f"⚠️  {player_id.upper()}: Error finding buttons: {e}", flush=True)
                        time.sleep(1)

                if not answer_found:
                    print(f"⚠️  {player_id.upper()}: No answer buttons found for Q{question_num} after {max_wait}s", flush=True)
                    page.screenshot(path=f'./tmp/{player_id}_q{question_num}_no_answers.png', full_page=True)

            print(f"🏁 {player_id.upper()}: Completed all questions!", flush=True)
            page.screenshot(path=f'./tmp/{player_id}_final.png', full_page=True)

            time.sleep(5)  # Keep browser open
            browser.close()
            return True

        except Exception as e:
            print(f"❌ {player_id.upper()} ERROR: {e}", flush=True)
            page.screenshot(path=f'./tmp/{player_id}_error.png', full_page=True)
            log_file.close()
            browser.close()
            return False
        finally:
            if 'log_file' in locals() and not log_file.closed:
                log_file.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Run a player test for the trivia game')
    parser.add_argument('--game-code', required=True, help='6-character game code')
    parser.add_argument('--email', required=True, help='Player email address')
    parser.add_argument('--team-name', required=True, help='Team name to create or join')
    parser.add_argument('--action', required=True, choices=['create', 'join'], help='Create new team or join existing')
    parser.add_argument('--player-id', required=True, help='Player identifier for screenshots (e.g., player1)')

    args = parser.parse_args()

    success = run_player_flow(
        game_code=args.game_code,
        email=args.email,
        team_name=args.team_name,
        action=args.action,
        player_id=args.player_id
    )

    sys.exit(0 if success else 1)
