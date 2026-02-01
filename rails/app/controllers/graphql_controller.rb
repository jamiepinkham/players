class GraphqlController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :authenticate_user_from_jwt!

  def execute
    variables = prepare_variables(params[:variables])
    query = params[:query]
    operation_name = params[:operationName]

    # Pass current_user to context if available
    # Mutations will check authentication as needed
    context = {
      current_user: current_user_from_jwt,
    }
    result = BmplFinancesSchema.execute(query, variables: variables, context: context, operation_name: operation_name)
    render json: result
  rescue StandardError => e
    Rails.logger.error("GraphQL execution error: #{e.class} - #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))

    if Rails.env.development?
      handle_error_in_development(e)
    else
      render json: { errors: [{ message: "Internal server error" }], data: {} }, status: 500
    end
  end

  private

  # Handle variables in form data, JSON body, or a blank value
  def prepare_variables(variables_param)
    case variables_param
    when String
      if variables_param.present?
        JSON.parse(variables_param) || {}
      else
        {}
      end
    when Hash
      variables_param
    when ActionController::Parameters
      variables_param.to_unsafe_hash # GraphQL-Ruby will validate name and type of incoming variables.
    when nil
      {}
    else
      raise ArgumentError, "Unexpected parameter: #{variables_param}"
    end
  end

  def handle_error_in_development(e)
    render json: {
      errors: [{
        message: e.message,
        type: e.class.name
      }],
      data: {}
    }, status: 500
  end
end
