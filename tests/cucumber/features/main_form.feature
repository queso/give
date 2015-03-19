Feature: Allow consumer to complete the giving web form and receive an email receipt.
    Also, present the user their receipt immediately after the valid form submission.

  As a consumer of give
  I want to complete the form and submit it
  So that I can take their donation information and submit it to Stripe

  Background:
    Given I am signed out

  Scenario: A consumer can submit the form with valid information
    Given I am on the give page
    When I enter valid form information
    And I click on the submit button
    Then My form data should be submitted to Stripe
    Then I should be redirected to the thanks page

  Scenario: A consumer cannot submit the form with bad information
    Given I am on the give page
    When I enter invalid form information
    And I click on the submit button
    Then My form data should be submitted to Stripe
    Then I should see an invalid data error