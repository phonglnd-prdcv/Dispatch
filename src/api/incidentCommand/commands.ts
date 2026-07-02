import { createApiEndpoint } from '@/api/common/client';
import { type CommandResult, type CommandsResult, type SaveCommandInput } from '@/models/v4/incidentCommand/commandDefinition';

const seg = (value: string | number) => encodeURIComponent(String(value));

/** All command definitions (templates) for the department. */
export const getAllCommands = async () => {
  const response = await createApiEndpoint('/Commands/GetAllCommands').get<CommandsResult>();
  return response.data;
};

export const getCommand = async (commandDefinitionId: number) => {
  const response = await createApiEndpoint(`/Commands/GetCommand/${seg(commandDefinitionId)}`).get<CommandResult>();
  return response.data;
};

/** Resolve the template for a call type (pass 0 for "Any Call Type"; the server falls back to it). */
export const getCommandForCallType = async (callTypeId: number) => {
  const response = await createApiEndpoint(`/Commands/GetCommandForCallType/${seg(callTypeId)}`).get<CommandResult>();
  return response.data;
};

export const saveCommand = async (input: SaveCommandInput) => {
  const response = await createApiEndpoint('/Commands/SaveCommand').post<CommandResult>({ ...input });
  return response.data;
};

export const deleteCommand = async (commandDefinitionId: number) => {
  const response = await createApiEndpoint(`/Commands/DeleteCommand/${seg(commandDefinitionId)}`).delete<CommandResult>();
  return response.data;
};
