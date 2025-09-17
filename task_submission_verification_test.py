#!/usr/bin/env python3
"""
Task Submission Emergency Fix Verification
This script verifies that the critical bug fix works correctly
"""

import requests
import json
import time
import sys

def test_task_submission_fix():
    """
    Test the complete task submission pipeline to verify the emergency fix
    """
    
    print("🔧 TESTING TASK SUBMISSION EMERGENCY FIX")
    print("=" * 50)
    
    # Test data - simulating what frontend sends
    base_url = "https://ftxadlakjhklmrfznciq.supabase.co/functions/v1"
    test_user_id = "fee8c87b-c7b6-4294-b9be-145522878682"
    
    # Test 1: Task Router
    print("\n✅ Test 1: Task Router Function")
    try:
        response = requests.post(f"{base_url}/task-router", 
            json={
                "taskContent": "Create a social media marketing plan for a startup",
                "userPreferences": {"preferLowerCost": True}
            },
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            selected_agent = data["data"]["selectedAgent"]
            reasoning = data["data"]["reasoning"]
            print(f"✅ Task Router: SUCCESS")
            print(f"   Selected Agent: {selected_agent}")
            print(f"   Reasoning: {reasoning}")
        else:
            print(f"❌ Task Router: FAILED - {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Task Router: ERROR - {e}")
        return False
    
    # Test 2: Task Submission
    print("\n✅ Test 2: Task Submission Function")
    try:
        task_data = {
            "task": {
                "user_id": test_user_id,
                "task_content": "VERIFICATION TEST: Create a comprehensive business plan for an eco-friendly clothing brand focusing on sustainable materials and ethical manufacturing",
                "selected_agent": selected_agent,
                "agent_reasoning": reasoning,
                "status": "pending",
                "priority": "normal",
                "estimated_cost": 0
            }
        }
        
        response = requests.post(f"{base_url}/submit-task", 
            json=task_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            task_id = data["data"]["id"]
            print(f"✅ Task Submission: SUCCESS")
            print(f"   Task ID: {task_id}")
            print(f"   Status: {data['data']['status']}")
            print(f"   Message: {data['message']}")
            
            # Wait for processing
            print("\n⏳ Waiting for AI processing...")
            time.sleep(30)  # Give time for AI processing
            
            return task_id
        else:
            print(f"❌ Task Submission: FAILED - {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Task Submission: ERROR - {e}")
        return False
    
if __name__ == "__main__":
    task_id = test_task_submission_fix()
    
    if task_id:
        print(f"\n🎉 EMERGENCY FIX VERIFICATION: SUCCESS!")
        print(f"   Task {task_id} was created successfully")
        print(f"   The critical task submission bug has been RESOLVED!")
        print(f"\n🌐 Users can now submit tasks at: https://cmxtvodxz9om.space.minimax.io")
    else:
        print(f"\n❌ EMERGENCY FIX VERIFICATION: FAILED")
        print(f"   Task submission is still broken")
        sys.exit(1)
