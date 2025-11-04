#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Host test script - Creates a game and outputs the game code.
Runs independently and waits for teams to be ready before starting questions.
"""

from playwright.sync_api import sync_playwright, Page
import time
import re
import os
import sys

def run_host_flow():
    """Run the host game flow and return game code."""

    os.makedirs('./tmp', exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # Navigate to app
            print("🚀 HOST: Navigating to app", flush=True)
            page.goto('http://localhost:5173')
            time.sleep(2)
            page.screenshot(path='./tmp/host_01_initial.png', full_page=True)

            # Login
            print("🔐 HOST: Logging in as host1@example.com", flush=True)
            email_input = page.locator('input[type="email"]').first
            email_input.fill('host1@example.com')

            password_input = page.locator('input[type="password"]').first
            password_input.fill('Password123!')

            # Select Host role
            host_button = page.locator('button:has-text("Host")').first
            if host_button.is_visible(timeout=1000):
                host_button.click()

            login_button = page.locator('button:has-text("Sign In")').first
            login_button.click()

            page.wait_for_load_state('networkidle')
            time.sleep(2)
            print("✅ HOST: Logged in", flush=True)

            # Navigate to host page
            page.goto('http://localhost:5173/host')
            time.sleep(2)
            page.screenshot(path='./tmp/host_02_host_page.png', full_page=True)

            # Create game
            print("🎮 HOST: Creating game", flush=True)
            create_button = page.locator('button:has-text("New Game")').first
            create_button.click()
            time.sleep(1)

            # Fill game name
            name_input = page.locator('input').first
            name_input.fill('Automated Test Game')
            time.sleep(0.5)

            # Click Create Game
            create_game_btn = page.locator('button:has-text("Create Game")').first
            create_game_btn.click()
            page.wait_for_load_state('networkidle')
            time.sleep(3)

            print("✅ HOST: Game created, waiting for modal to close", flush=True)

            # Wait for modal to close
            try:
                page.wait_for_selector('[role="dialog"]', state='hidden', timeout=10000)
                print("✅ HOST: Modal closed", flush=True)
            except:
                print("⏳ HOST: Modal didn't close with selector, waiting anyway...", flush=True)
                time.sleep(3)

            page.screenshot(path='./tmp/host_03_game_created.png', full_page=True)

            # Find and click Play button for the game we just created
            print("▶️  HOST: Looking for Play button", flush=True)

            # Wait for games to appear
            time.sleep(2)

            # Find play button using the same logic as the working test_game_flow.py
            played = False
            play_button = None

            all_buttons = page.locator('button').all()
            print(f"📋 HOST: Found {len(all_buttons)} total buttons", flush=True)

            # Method 1: Find by dark background styling
            for i, btn in enumerate(all_buttons):
                if btn.is_visible():
                    class_attr = btn.get_attribute('class') or ''
                    # Play buttons often have darker styling
                    if 'bg-black' in class_attr or 'bg-primary' in class_attr or 'dark:bg' in class_attr:
                        # Make sure it's in the game row area (after position 2)
                        if i > 2:
                            print(f"📋 HOST: Button {i} has dark styling: {class_attr[:50]}", flush=True)
                            play_button = btn
                            print(f"✅ HOST: Selected button {i} as play button based on styling", flush=True)
                            break

            # Method 2: If that doesn't work, try finding by SVG polygon (play icon triangle)
            if not play_button:
                for i, btn in enumerate(all_buttons):
                    if btn.is_visible() and i > 2:
                        html = btn.inner_html()
                        # Play button has a polygon SVG element for the triangle
                        if 'polygon' in html and 'M5,3' in html:  # Common play icon path
                            play_button = btn
                            print(f"✅ HOST: Selected button {i} as play button based on SVG polygon", flush=True)
                            break

            if play_button and play_button.is_visible(timeout=3000):
                print("✅ HOST: Found Play button, clicking...", flush=True)
                play_button.click()
                played = True
            else:
                print("❌ HOST: Could not find any Play button", flush=True)
                browser.close()
                return None

            # Wait for game controller view to load
            print("⏳ HOST: Waiting for game controller to load...", flush=True)
            page.wait_for_load_state('networkidle')
            time.sleep(3)

            page.screenshot(path='./tmp/host_04_welcome_screen.png', full_page=True)

            # Check if we're on the welcome screen by looking for "Welcome to the Game!" text
            page_content = page.content()
            if 'Welcome to the Game!' not in page_content and 'Game Code:' not in page_content:
                print(f"❌ HOST: Did not reach welcome screen", flush=True)
                print(f"📍 HOST: Current URL: {page.url}", flush=True)
                browser.close()
                return None

            print("✅ HOST: Reached 'Welcome to the Game!' screen", flush=True)

            # Extract game code
            game_code = None
            game_code_element = page.locator('text=/Game Code:.*[A-Z0-9]{6}/').first
            if game_code_element.is_visible(timeout=2000):
                game_code_text = game_code_element.text_content()
                game_code_match = re.search(r'([A-Z0-9]{6})', game_code_text)
                if game_code_match:
                    game_code = game_code_match.group(1)

            if not game_code:
                print("❌ HOST: Could not extract game code", flush=True)
                browser.close()
                return None

            print(f"🎮 GAME_CODE: {game_code}", flush=True)
            print(f"✅ HOST: Game ready, waiting for teams...", flush=True)

            # Wait for teams to be ready
            teams_ready = False
            max_wait = 60  # seconds
            start_time = time.time()

            check_count = 0
            while not teams_ready and (time.time() - start_time) < max_wait:
                # Refresh page every 3 checks (every 6 seconds) to get latest player data
                if check_count > 0 and check_count % 3 == 0:
                    print("🔄 HOST: Refreshing page to check for new players...", flush=True)
                    page.reload()
                    time.sleep(2)

                check_count += 1
                content = page.content()

                # Check if "Start Game" button is visible (indicates teams are ready)
                start_button = page.locator('button:has-text("Start Game")').first
                if start_button.is_visible(timeout=1000):
                    # Count how many players we have
                    player_count = content.count('User1') + content.count('User2') + content.count('User3') + content.count('User4')

                    # Check if we have at least 2 teams
                    has_team_a = 'Team A' in content
                    has_team_b = 'Team B' in content

                    # Wait for all 4 players to join before starting
                    if has_team_a and has_team_b and player_count >= 4:
                        print(f"✅ HOST: Teams ready with {player_count} players!", flush=True)
                        teams_ready = True
                        break
                    else:
                        print(f"⏳ HOST: Waiting for all players... (TeamA: {has_team_a}, TeamB: {has_team_b}, Players: {player_count}/4)", flush=True)

                time.sleep(2)
                page.screenshot(path='./tmp/host_05_waiting_teams.png', full_page=True)

            if not teams_ready:
                print("⚠️  HOST: Initial timeout - players likely joining now, waiting longer...", flush=True)

                # Wait another 60 seconds for players to create teams
                extended_wait = 60
                start_extended = time.time()

                while not teams_ready and (time.time() - start_extended) < extended_wait:
                    # Refresh page to get latest data
                    print("🔄 HOST: Refreshing page to check for teams...", flush=True)
                    page.reload()
                    time.sleep(3)
                    page.screenshot(path='./tmp/host_06_after_refresh.png', full_page=True)

                    content = page.content()

                    # Check if "Start Game" button is visible
                    start_button = page.locator('button:has-text("Start Game")').first
                    if start_button.is_visible(timeout=1000):
                        # Count players
                        player_count = content.count('User1') + content.count('User2') + content.count('User3') + content.count('User4')

                        # Check if we have both teams
                        has_team_a = 'Team A' in content
                        has_team_b = 'Team B' in content

                        # Wait for all 4 players
                        if has_team_a and has_team_b and player_count >= 4:
                            print(f"✅ HOST: Teams appeared after refresh with {player_count} players!", flush=True)
                            teams_ready = True
                            break
                        else:
                            print(f"⏳ HOST: Waiting for all players... (TeamA: {has_team_a}, TeamB: {has_team_b}, Players: {player_count}/4)", flush=True)
                    else:
                        print(f"⏳ HOST: Still waiting for teams... ({int(time.time() - start_extended)}s elapsed)", flush=True)

                    time.sleep(5)

                if not teams_ready:
                    print("⚠️  HOST: Still no teams after extended wait", flush=True)
                    browser.close()
                    return game_code

            # Click Start Game button now that all players are ready
            print("🎮 HOST: All players ready, clicking Start Game button...", flush=True)
            start_game_btn = page.locator('button:has-text("Start Game")').first
            if start_game_btn.is_visible(timeout=5000):
                start_game_btn.click()
                time.sleep(2)
                page.screenshot(path='./tmp/host_07_game_started.png', full_page=True)
                print("✅ HOST: Game started!", flush=True)
            else:
                print("⚠️  HOST: Start Game button not found!", flush=True)
                browser.close()
                return game_code

            # Start playing through questions
            print("🎲 HOST: Starting questions", flush=True)

            for question_num in range(1, 6):  # 5 questions
                print(f"📝 HOST: Question {question_num}", flush=True)

                # Click Next button
                next_btn = page.locator('button:has-text("Next")').first
                if next_btn.is_visible(timeout=3000):
                    next_btn.click()
                    time.sleep(3)  # Wait for players to answer
                    page.screenshot(path=f'./tmp/host_question_{question_num}.png', full_page=True)
                else:
                    print(f"⚠️  HOST: Next button not visible for Q{question_num}", flush=True)
                    break

            print("🏁 HOST: Game complete!", flush=True)
            page.screenshot(path='./tmp/host_final.png', full_page=True)

            time.sleep(5)  # Keep browser open for a bit
            browser.close()
            return game_code

        except Exception as e:
            print(f"❌ HOST ERROR: {e}", flush=True)
            browser.close()
            return None

if __name__ == "__main__":
    game_code = run_host_flow()
    if game_code:
        sys.exit(0)
    else:
        sys.exit(1)
