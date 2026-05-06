export interface UserPermissions {
	can_change_password: boolean;
	can_delete_account: boolean;
	can_bind_whitelist: boolean;
	can_unbind_whitelist: boolean;
	can_get_preferences: boolean;
	can_set_preferences: boolean;
	can_query_server: boolean;
	can_stop_server: boolean;
	can_access_server_data: boolean;
	can_view_instances: boolean;
	can_delete_instance: boolean;
	can_create_custom_instance: boolean;
	can_view_tasks: boolean;
	can_view_task_output: boolean;
	can_trigger_task: boolean;
	can_run_backup: boolean;
	can_run_archive: boolean;
	can_watch_server_status: boolean;
	can_watch_instance_status: boolean;
	can_view_player_history: boolean;
	can_view_balance_history: boolean;
	can_view_auto_archive_idle: boolean;
}
