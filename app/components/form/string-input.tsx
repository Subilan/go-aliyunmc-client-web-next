import { FormControl, FormHelperText, Input, InputLabel } from '@mui/material';
import { Controller, type ControllerProps } from 'react-hook-form';

export default function StringInput(props: {
	control: any;
	maxlength?: number;
	minlength?: number;
	required?: boolean,
	type?: 'text' | 'password';
	label: string;
	name: string;
	rules?: ControllerProps['rules'];
}) {
	return (
		<Controller
			name={props.name}
			control={props.control}
			rules={{
				required: props.required && {
					value: true,
					message: '此项必填'
				},
				maxLength: props.maxlength && {
					value: props.maxlength,
					message: `最大长度为 ${props.maxlength} 字符`
				},
				minLength: props.minlength && {
					value: props.minlength,
					message: `最小长度为 ${props.minlength} 字符`
				},
				...props.rules
			}}
			defaultValue={''}
			render={({ field, fieldState }) => (
				<FormControl error={!!fieldState.error}>
					<InputLabel>{props.label}</InputLabel>
					<Input autoComplete="off" type={props.type ?? 'text'} required {...field} />
					<FormHelperText>{fieldState.error?.message}</FormHelperText>
				</FormControl>
			)}
		/>
	);
}
