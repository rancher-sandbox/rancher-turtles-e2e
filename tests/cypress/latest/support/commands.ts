/*
Copyright © 2022 - 2023 SUSE LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// In this file you can write your custom commands and overwrite existing commands.

import 'cypress-file-upload';
import * as cypressLib from '@rancher-ecp-qa/cypress-library';

// Generic commands
// Go to specific Sub Menu from Access Menu
Cypress.Commands.add('accesMenuSelection', (firstAccessMenu,secondAccessMenu) => {
  cypressLib.accesMenu(firstAccessMenu);
  cypressLib.accesMenu(secondAccessMenu);
});

// Fleet commands
// Add path on "Git Repo:Create"
Cypress.Commands.add('addPathOnGitRepoCreate', (path) => {
  cy.clickButton('Add Path');
  cy.get('input[placeholder="e.g. /directory/in/your/repo"]').type(path);
})

// Command add Fleet Git Repository
Cypress.Commands.add('addFleetGitRepo', ({ repoName, repoUrl, branch, path }) => {
  cy.accesMenuSelection('Continuous Delivery', 'Git Repos');
  cy.contains('fleet-').click();
  cy.contains('fleet-local').should('be.visible').click();
  cy.clickButton('Add Repository');
  cy.contains('Git Repo:').should('be.visible');
  cy.typeValue('Name', repoName);
  cy.typeValue('Repository URL', repoUrl);
  cy.typeValue('Branch Name', branch);
  // Path is not required when git repo contains 1 application folder only.
  if (path) {
    cy.addPathOnGitRepoCreate(path);
  }
  cy.clickButton('Next');
  cy.get('button.btn').contains('Previous').should('be.visible');
})

// Command to delete all repos pressent in Fleet local
Cypress.Commands.add('deleteAllFleetRepos', () => {
  cy.accesMenuSelection('Continuous Delivery', 'Git Repos');
  cy.contains('fleet-').click();
  cy.contains('fleet-local').should('be.visible').click();
  cy.viewport(1920, 1080);
  cy.get('body').then(($body) => {
    if ($body.text().includes('Delete')) {
      cy.get('[width="30"] > .checkbox-outer-container.check').click();
      cy.get('.btn').contains('Delete').click({ctrlKey: true});
      cy.get('.btn', { timeout: 20000 }).contains('Delete').should('not.exist');
      cy.contains('No repositories have been added', { timeout: 20000 }).should('be.visible')
    };
  });
});

// Command to set CAPI Auto-import on default namespace
Cypress.Commands.add('namespaceAutoImport', (mode) => {
  cy.contains('local')
    .click();
  cypressLib.accesMenu('Projects/Namespaces');
  cy.contains('Create Project')
    .should('be.visible');

  // Select default namespace
  cy.setNamespace('Project: Default');

  // Reload required since kebab menu icon not clickable
  cy.reload(true);
  cy.getBySel('sortable-table-0-action-button').click();

  cy.contains(mode + ' CAPI Auto-Import')
    .click();
  cy.namespaceReset();
});

// Command to set namespace selection
Cypress.Commands.add('setNamespace', (namespace) => {
  cy.contains('Only User Namespaces') // eslint-disable-line cypress/unsafe-to-chain-command
    .click()
    .type(namespace + '{enter}{esc}');
});

// Command to reset namespace selection to default 'Only User Namespaces'
Cypress.Commands.add('namespaceReset', () => {
  cy.getBySel('namespaces-values-close-0').click();
  cy.contains('Only User Namespaces').click();
  cy.getBySel('namespaces-dropdown').click();
});

// Command to check CAPI cluster running status
Cypress.Commands.add('checkCAPICluster', (clustername) => {
  cypressLib.burgerMenuToggle();
  cy.accesMenuSelection('Cluster Management', 'CAPI');
  cy.contains("CAPI Clusters").click();
  cy.contains('Provisioned ' + clustername, {timeout:60000});
  cy.contains("Machine Deployments").click();
  cy.contains('Running ' + clustername, {timeout:60000});
  cy.contains("Machine Sets").click();
  cy.contains('Active ' + clustername, {timeout:60000});
});

Cypress.Commands.overwrite('type', (originalFn, subject, text, options = {}) => {
  options.delay = 100;
  return originalFn(subject, text, options);
});

// Add a delay between command without using cy.wait()
// https://github.com/cypress-io/cypress/issues/249#issuecomment-443021084
const COMMAND_DELAY = 1000;

for (const command of ['visit', 'click', 'trigger', 'type', 'clear', 'reload', 'contains']) {
  Cypress.Commands.overwrite(command, (originalFn, ...args) => {
    const origVal = originalFn(...args);

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(origVal);
      }, COMMAND_DELAY);
    });
  });
}; 

