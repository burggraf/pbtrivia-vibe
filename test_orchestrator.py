#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test orchestrator - Coordinates host and player scripts running in parallel.

This script:
1. Launches the host script and waits for game code
2. Launches 4 player scripts in parallel with the game code
3. Monitors all scripts and reports results
"""

import subprocess
import time
import re
import sys
from threading import Thread

def run_host_and_get_code():
    """Run host script and extract game code from output."""
    print("="*60)
    print("🎮 ORCHESTRATOR: Starting host script")
    print("="*60)

    try:
        # Run host script and capture output in real-time
        process = subprocess.Popen(
            [sys.executable, 'test_host.py'],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )

        game_code = None

        # Read output line by line until we get game code
        for line in iter(process.stdout.readline, ''):
            if line:
                print(f"HOST: {line.rstrip()}")

                # Extract game code
                match = re.search(r'GAME_CODE:\s*([A-Z0-9]{6})', line)
                if match:
                    game_code = match.group(1)
                    print(f"\n{'='*60}")
                    print(f"✅ ORCHESTRATOR: Got game code: {game_code}")
                    print(f"{'='*60}\n")
                    # Return immediately with game code, don't wait for process to finish
                    return game_code, process

        # If we exit the loop without finding game code
        process.wait()
        print("❌ ORCHESTRATOR: Failed to get game code")
        return None, process

    except Exception as e:
        print(f"❌ ORCHESTRATOR: Error running host: {e}")
        return None, None

def run_player(game_code, email, team_name, action, player_id):
    """Run a single player script."""
    print(f"\n🎭 ORCHESTRATOR: Launching {player_id}")

    try:
        process = subprocess.Popen(
            [
                'python', 'test_player.py',
                '--game-code', game_code,
                '--email', email,
                '--team-name', team_name,
                '--action', action,
                '--player-id', player_id
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )

        # Read output line by line
        for line in iter(process.stdout.readline, ''):
            if line:
                print(f"{player_id.upper()}: {line.rstrip()}")

        process.wait()
        return process.returncode == 0

    except Exception as e:
        print(f"❌ {player_id.upper()}: Error: {e}")
        return False

def main():
    """Main orchestrator logic."""
    print("\n" + "="*60)
    print("🚀 TRIVIA GAME TEST ORCHESTRATOR")
    print("="*60 + "\n")

    # Step 1: Run host and get game code
    game_code, host_process = run_host_and_get_code()

    if not game_code:
        print("❌ ORCHESTRATOR: Cannot proceed without game code")
        sys.exit(1)

    # Start background thread to continue reading host output
    def read_host_output():
        for line in iter(host_process.stdout.readline, ''):
            if line:
                print(f"HOST: {line.rstrip()}")
        host_process.wait()

    host_thread = Thread(target=read_host_output, daemon=True)
    host_thread.start()

    # Step 2: Define player configurations
    player_configs = [
        {
            'email': 'user1@example.com',
            'team_name': 'Team A',
            'action': 'create',
            'player_id': 'player1'
        },
        {
            'email': 'user2@example.com',
            'team_name': 'Team A',
            'action': 'join',
            'player_id': 'player2'
        },
        {
            'email': 'user3@example.com',
            'team_name': 'Team B',
            'action': 'create',
            'player_id': 'player3'
        },
        {
            'email': 'user4@example.com',
            'team_name': 'Team B',
            'action': 'join',
            'player_id': 'player4'
        }
    ]

    # Step 3: Launch player 1 and player 3 first (team creators)
    print("\n" + "="*60)
    print("👥 ORCHESTRATOR: Launching team creators (Players 1 & 3)")
    print("="*60)

    creator_threads = []
    creator_results = {}

    for config in [player_configs[0], player_configs[2]]:  # Player 1 and 3
        def run_player_thread(cfg):
            result = run_player(
                game_code=game_code,
                email=cfg['email'],
                team_name=cfg['team_name'],
                action=cfg['action'],
                player_id=cfg['player_id']
            )
            creator_results[cfg['player_id']] = result

        thread = Thread(target=run_player_thread, args=(config,))
        thread.start()
        creator_threads.append(thread)

    # Don't wait for team creators to finish (they stay alive for the whole game)
    # Just give them time to create the teams
    print("\n⏳ ORCHESTRATOR: Waiting 10 seconds for teams to be created...")
    time.sleep(10)

    # Step 4: Launch player 2 and player 4 (team joiners)
    print("\n" + "="*60)
    print("👥 ORCHESTRATOR: Launching team joiners (Players 2 & 4)")
    print("="*60)

    joiner_threads = []
    joiner_results = {}

    for config in [player_configs[1], player_configs[3]]:  # Player 2 and 4
        def run_player_thread(cfg):
            result = run_player(
                game_code=game_code,
                email=cfg['email'],
                team_name=cfg['team_name'],
                action=cfg['action'],
                player_id=cfg['player_id']
            )
            joiner_results[cfg['player_id']] = result

        thread = Thread(target=run_player_thread, args=(config,))
        thread.start()
        joiner_threads.append(thread)

    # Collect all player threads
    all_player_threads = creator_threads + joiner_threads

    print("\n" + "="*60)
    print("⏳ ORCHESTRATOR: All players launched, waiting for game to complete...")
    print("="*60)

    # Step 5: Wait for host to finish
    print("\n⏳ ORCHESTRATOR: Waiting for host to finish...")
    host_process.wait()

    print("\n⏳ ORCHESTRATOR: Host finished, waiting for all players...")
    # Now wait for all player threads to finish
    for thread in all_player_threads:
        thread.join()

    print("\n" + "="*60)
    print("✅ ORCHESTRATOR: All players finished")
    print("="*60)

    # Step 6: Report results
    print("\n" + "="*60)
    print("📊 TEST RESULTS")
    print("="*60)

    all_results = {**creator_results, **joiner_results}

    for player_id, success in sorted(all_results.items()):
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {player_id}")

    host_status = "✅ PASS" if host_process.returncode == 0 else "❌ FAIL"
    print(f"{host_status}: host")

    all_success = all(all_results.values()) and host_process.returncode == 0

    print("="*60)
    if all_success:
        print("✅ ALL TESTS PASSED!")
    else:
        print("❌ SOME TESTS FAILED")
    print("="*60 + "\n")

    print(f"📸 Screenshots saved in ./tmp/ directory")

    sys.exit(0 if all_success else 1)

if __name__ == "__main__":
    main()
